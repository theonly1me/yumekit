import type { FailureIssue } from "../sceneCalls.js";
import type { Field } from "./fields.js";
import { pathKey, valueAt, type JsonValue, type PropPath } from "./propPath.js";

function fieldPathsOf(options: {
  fields: Field[];
  draft: JsonValue;
  parent: PropPath;
}): PropPath[] {
  const { fields, draft, parent } = options;
  return fields.flatMap((field) => {
    const path = [...parent, field.name];
    const value = valueAt({ value: draft, path });
    const items = Array.isArray(value) ? value : [];
    switch (field.kind) {
      case "text-list":
        return [path, ...items.map((...[, index]) => [...path, index])];
      case "object-list":
        return [
          path,
          ...items.flatMap((...[, index]) => [
            [...path, index],
            ...fieldPathsOf({
              fields: field.fields,
              draft,
              parent: [...path, index],
            }),
          ]),
        ];
      case "group":
        return [
          path,
          ...fieldPathsOf({ fields: field.fields, draft, parent: path }),
        ];
      default:
        return [path];
    }
  });
}

export function routeIssues(options: {
  issues: FailureIssue[];
  fields: Field[];
  draft: JsonValue;
}): { byField: Map<string, string>; unplaced: string[] } {
  const known = new Set(
    fieldPathsOf({
      fields: options.fields,
      draft: options.draft,
      parent: [],
    }).map(pathKey),
  );
  const byField = new Map<string, string>();
  const unplaced: string[] = [];
  for (const issue of options.issues) {
    const length = issue.path.findLastIndex((...[, index]) =>
      known.has(pathKey(issue.path.slice(0, index + 1))),
    );
    if (length === -1) {
      unplaced.push(issue.message);
      continue;
    }
    const key = pathKey(issue.path.slice(0, length + 1));
    const before = byField.get(key);
    byField.set(
      key,
      before === undefined ? issue.message : `${before} ${issue.message}`,
    );
  }
  return { byField, unplaced };
}
