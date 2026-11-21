import type { FailureIssue } from "../sceneCalls.js";
import type { PropSchema } from "./propSchema.js";
import { valueAt, type JsonValue } from "./propPath.js";

const toolWords = /zod|expected|received/i;

const fallbackMessage = "This value does not fit this field.";

function countOf(options: { count: number; one: string; many: string }) {
  return `${String(options.count)} ${options.count === 1 ? options.one : options.many}`;
}

function schemaAt(options: {
  schema: PropSchema;
  path: (string | number)[];
}): { schema: PropSchema; isRequired: boolean } | undefined {
  const [first, ...rest] = options.path;
  if (first === undefined) return { schema: options.schema, isRequired: true };
  const child =
    typeof first === "number"
      ? options.schema.items
      : options.schema.properties?.[first];
  if (child === undefined) return undefined;
  const found = schemaAt({ schema: child, path: rest });
  if (found === undefined || rest.length > 0) return found;
  const isRequired =
    typeof first === "number" ||
    (options.schema.required ?? []).includes(first);
  return { schema: found.schema, isRequired };
}

function numberMessage(schema: PropSchema): string {
  const { minimum, maximum } = schema;
  const kind = schema.type === "integer" ? "a whole number" : "a number";
  if (minimum !== undefined && maximum !== undefined) {
    return `Use ${kind} from ${String(minimum)} to ${String(maximum)}`;
  }
  if (minimum !== undefined) return `Use ${kind} of ${String(minimum)} or more`;
  if (maximum !== undefined) return `Use ${kind} of ${String(maximum)} or less`;
  return `Use ${kind}`;
}

function stringMessage(options: { schema: PropSchema; value: string }) {
  const { schema, value } = options;
  if (schema.enum !== undefined && !schema.enum.includes(value)) {
    return `Choose one of ${schema.enum.join(", ")}`;
  }
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    return `Give at least ${countOf({ count: schema.minLength, one: "character", many: "characters" })}`;
  }
  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    return `Use at most ${countOf({ count: schema.maxLength, one: "character", many: "characters" })}`;
  }
  return undefined;
}

function listMessage(options: { schema: PropSchema; value: JsonValue[] }) {
  const { schema, value } = options;
  if (schema.minItems !== undefined && value.length < schema.minItems) {
    return `Add at least ${countOf({ count: schema.minItems, one: "item", many: "items" })}`;
  }
  if (schema.maxItems !== undefined && value.length > schema.maxItems) {
    return `Use at most ${countOf({ count: schema.maxItems, one: "item", many: "items" })}`;
  }
  return undefined;
}

function messageFor(options: {
  schema: PropSchema;
  isRequired: boolean;
  value: JsonValue | undefined;
}): string | undefined {
  const { schema, isRequired, value } = options;
  if (value === undefined) return isRequired ? "Fill in this field" : undefined;
  const isNumberSchema = schema.type === "number" || schema.type === "integer";
  if (isNumberSchema) {
    const isWhole = schema.type !== "integer" || Number.isInteger(value);
    const fits =
      typeof value === "number" &&
      isWhole &&
      (schema.minimum === undefined || value >= schema.minimum) &&
      (schema.maximum === undefined || value <= schema.maximum);
    return fits ? undefined : numberMessage(schema);
  }
  if (schema.type === "string" || schema.enum !== undefined) {
    return typeof value === "string"
      ? stringMessage({ schema, value })
      : "Give a text";
  }
  if (schema.type === "array") {
    return Array.isArray(value)
      ? listMessage({ schema, value })
      : "Give a list";
  }
  if (schema.type === "boolean" && typeof value !== "boolean") {
    return "Choose on or off";
  }
  return undefined;
}

export function plainIssue(options: {
  issue: FailureIssue;
  schema: PropSchema;
  props: JsonValue;
}): FailureIssue {
  const { issue } = options;
  const found = schemaAt({ schema: options.schema, path: issue.path });
  const plain =
    found === undefined
      ? undefined
      : messageFor({
          ...found,
          value: valueAt({ value: options.props, path: issue.path }),
        });
  if (plain !== undefined) return { path: issue.path, message: plain };
  return {
    path: issue.path,
    message: toolWords.test(issue.message) ? fallbackMessage : issue.message,
  };
}
