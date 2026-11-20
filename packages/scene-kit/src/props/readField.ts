import type { z } from "zod";

export function readField<Value>(options: {
  field: z.ZodType<Value>;
  value: unknown;
  fallback: Value;
  repair?: (value: unknown) => unknown;
}): Value {
  const parsed = options.field.safeParse(options.value);
  if (parsed.success) {
    return parsed.data;
  }
  if (options.repair === undefined) {
    return options.fallback;
  }
  const repaired = options.field.safeParse(options.repair(options.value));
  return repaired.success ? repaired.data : options.fallback;
}

export function shortenText(maxLength: number): (value: unknown) => unknown {
  return (value) => {
    if (typeof value !== "string") {
      return undefined;
    }
    const text = value.trim();
    return text.length <= maxLength
      ? text
      : `${text.slice(0, maxLength - 1).trimEnd()}…`;
  };
}

export function keepValidItems(options: {
  item: z.ZodType;
  maxItems: number;
}): (value: unknown) => unknown {
  return (value) =>
    Array.isArray(value)
      ? value
          .filter((item) => options.item.safeParse(item).success)
          .slice(0, options.maxItems)
      : undefined;
}
