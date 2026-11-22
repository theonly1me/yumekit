import { readFile } from "node:fs/promises";
import { z } from "zod";

const recordedProperty = z.object({
  types: z.array(
    z.enum([
      "string",
      "integer",
      "number",
      "boolean",
      "array",
      "object",
      "null",
    ]),
  ),
  enum: z.array(z.union([z.string(), z.number()])).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  minItems: z.int().optional(),
  maxItems: z.int().optional(),
});

const recordedSchema = z.object({
  endpoint_id: z.string(),
  page: z.url(),
  required: z.array(z.string()),
  properties: z.record(z.string(), recordedProperty),
});

export type RecordedSchema = z.infer<typeof recordedSchema>;
type RecordedProperty = z.infer<typeof recordedProperty>;

export async function readRecordedSchema(
  endpointId: string,
): Promise<RecordedSchema> {
  const fileName = `${endpointId.replaceAll("/", "--")}.json`;
  const text = await readFile(
    new URL(`recordedSchemas/${fileName}`, import.meta.url),
    "utf8",
  );
  return recordedSchema.parse(JSON.parse(text));
}

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  return typeof value;
}

function propertyProblem(options: {
  name: string;
  value: unknown;
  property: RecordedProperty;
}): string | undefined {
  const { name, value, property } = options;
  const type = typeOf(value);
  const typeFits =
    property.types.some((allowed) => allowed === type) ||
    (type === "integer" && property.types.includes("number"));
  if (!typeFits)
    return `${name} is ${type}, not ${property.types.join(" or ")}`;
  if (
    property.enum !== undefined &&
    (typeof value === "string" || typeof value === "number") &&
    !property.enum.includes(value)
  ) {
    return `${name} ${String(value)} is not one of ${property.enum.join(", ")}`;
  }
  if (typeof value === "number") {
    if (property.minimum !== undefined && value < property.minimum) {
      return `${name} is below ${String(property.minimum)}`;
    }
    if (property.maximum !== undefined && value > property.maximum) {
      return `${name} is above ${String(property.maximum)}`;
    }
  }
  if (Array.isArray(value)) {
    if (property.minItems !== undefined && value.length < property.minItems) {
      return `${name} has fewer than ${String(property.minItems)} items`;
    }
    if (property.maxItems !== undefined && value.length > property.maxItems) {
      return `${name} has more than ${String(property.maxItems)} items`;
    }
  }
  return undefined;
}

export function schemaProblems(options: {
  schema: RecordedSchema;
  body: Record<string, unknown>;
}): string[] {
  const { schema, body } = options;
  const missing = schema.required
    .filter((name) => !(name in body))
    .map((name) => `${name} is required`);
  const wrong = Object.entries(body).flatMap(([name, value]) => {
    const property = schema.properties[name];
    if (property === undefined)
      return [`${name} is not a field of the endpoint`];
    const problem = propertyProblem({ name, value, property });
    return problem === undefined ? [] : [problem];
  });
  return [...missing, ...wrong];
}
