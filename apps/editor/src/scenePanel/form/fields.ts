import type { AssetKind, PropSchema } from "./propSchema.js";

const longestShortText = 200;

interface FieldBase {
  name: string;
  label: string;
  isRequired: boolean;
}

export type Field = FieldBase &
  (
    | { kind: "text"; isLong: boolean }
    | { kind: "number"; isInteger: boolean }
    | { kind: "choice"; options: string[] }
    | { kind: "switch" }
    | { kind: "asset"; assetKinds: readonly AssetKind[] }
    | { kind: "text-list"; itemLabel: string; maxItems: number | undefined }
    | {
        kind: "object-list";
        itemLabel: string;
        maxItems: number | undefined;
        fields: Field[];
      }
    | { kind: "group"; fields: Field[] }
  );

export function labelOf(name: string): string {
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

function singularLabelOf(name: string): string {
  return labelOf(name.endsWith("s") ? name.slice(0, -1) : name);
}

function assetKindsOf(schema: PropSchema): readonly AssetKind[] {
  if (schema.assetKinds !== undefined) return schema.assetKinds;
  return schema.assetKind === undefined ? [] : [schema.assetKind];
}

function fieldOf(options: {
  name: string;
  schema: PropSchema;
  isRequired: boolean;
}): Field | undefined {
  const { name, schema, isRequired } = options;
  const base = { name, label: schema.title ?? labelOf(name), isRequired };
  const assetKinds = assetKindsOf(schema);
  if (assetKinds.length > 0) {
    return {
      ...base,
      label: schema.title ?? labelOf(assetKinds.join(" or ")),
      kind: "asset",
      assetKinds,
    };
  }
  if (schema.enum !== undefined) {
    return { ...base, kind: "choice", options: schema.enum };
  }
  switch (schema.type) {
    case "string":
      return {
        ...base,
        kind: "text",
        isLong: (schema.maxLength ?? Infinity) > longestShortText,
      };
    case "number":
    case "integer":
      return { ...base, kind: "number", isInteger: schema.type === "integer" };
    case "boolean":
      return { ...base, kind: "switch" };
    case "object":
      return { ...base, kind: "group", fields: fieldsOf(schema) };
    case "array":
      return listFieldOf({ base, schema });
    default:
      return undefined;
  }
}

function listFieldOf(options: {
  base: FieldBase;
  schema: PropSchema;
}): Field | undefined {
  const { base, schema } = options;
  const itemLabel = singularLabelOf(base.name);
  const maxItems = schema.maxItems;
  if (schema.items?.type === "string") {
    return { ...base, kind: "text-list", itemLabel, maxItems };
  }
  if (schema.items?.type === "object") {
    const fields = fieldsOf(schema.items);
    return { ...base, kind: "object-list", itemLabel, maxItems, fields };
  }
  return undefined;
}

export function fieldsOf(schema: PropSchema): Field[] {
  const required = schema.required ?? [];
  return Object.entries(schema.properties ?? {}).flatMap(
    ([name, propertySchema]) => {
      const field = fieldOf({
        name,
        schema: propertySchema,
        isRequired: required.includes(name),
      });
      return field === undefined ? [] : [field];
    },
  );
}
