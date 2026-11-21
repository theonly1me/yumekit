export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type JsonObject = Record<string, JsonValue>;

export type PropPath = (string | number)[];

export function pathKey(path: PropPath): string {
  return path.join(".");
}

export function isJsonObject(
  value: JsonValue | undefined,
): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function valueAt(options: {
  value: JsonValue | undefined;
  path: PropPath;
}): JsonValue | undefined {
  const [first, ...rest] = options.path;
  if (first === undefined) return options.value;
  const { value } = options;
  const child =
    typeof first === "number"
      ? Array.isArray(value)
        ? value[first]
        : undefined
      : isJsonObject(value)
        ? value[first]
        : undefined;
  return valueAt({ value: child, path: rest });
}

export function withValueAt(options: {
  value: JsonValue | undefined;
  path: PropPath;
  next: JsonValue | undefined;
}): JsonValue | undefined {
  const { value, next } = options;
  const [first, ...rest] = options.path;
  if (first === undefined) return next;
  if (typeof first === "number") {
    const list = Array.isArray(value) ? [...value] : [];
    const child = withValueAt({ value: list[first], path: rest, next });
    if (child !== undefined) list[first] = child;
    return list;
  }
  const object: JsonObject = isJsonObject(value) ? value : {};
  const child = withValueAt({ value: object[first], path: rest, next });
  const others = Object.entries(object).filter(([key]) => key !== first);
  return Object.fromEntries(
    child === undefined ? others : [...others, [first, child]],
  );
}
