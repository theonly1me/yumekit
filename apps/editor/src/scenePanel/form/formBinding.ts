import type { Asset } from "../../engine/snapshot.js";
import type { Field } from "./fields.js";
import type { JsonValue, PropPath } from "./propPath.js";
import type { SendTiming } from "./useSceneDraft.js";

export interface FormBinding {
  valueAt: (path: PropPath) => JsonValue | undefined;
  issueAt: (path: PropPath) => string | undefined;
  change: (change: {
    path: PropPath;
    value: JsonValue | undefined;
    timing: SendTiming;
  }) => void;
  flush: () => void;
  assets: Asset[];
  isIssueBelowRow?: boolean;
}

export interface FieldProps<Kind extends Field["kind"]> {
  field: Extract<Field, { kind: Kind }>;
  path: PropPath;
  form: FormBinding;
}

export function emptyValueOf(field: Field): JsonValue {
  switch (field.kind) {
    case "text":
    case "asset":
      return "";
    case "number":
      return 0;
    case "choice":
      return field.options[0] ?? "";
    case "switch":
      return false;
    case "text-list":
    case "object-list":
    case "asset-list":
      return [];
    case "group":
      return newItemOf(field.fields);
  }
}

export function newItemOf(fields: Field[]): Record<string, JsonValue> {
  return Object.fromEntries(
    fields
      .filter((field) => field.isRequired)
      .map((field) => [field.name, emptyValueOf(field)]),
  );
}
