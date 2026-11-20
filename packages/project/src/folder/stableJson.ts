function withSortedKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withSortedKeys);
  }
  if (typeof value === "object" && value !== null) {
    const entries = new Map<string, unknown>(Object.entries(value));
    return Object.fromEntries(
      [...entries.keys()]
        .toSorted()
        .map((key) => [key, withSortedKeys(entries.get(key))]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(withSortedKeys(value), null, 2)}\n`;
}
