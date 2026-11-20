import { parseArgs, type ParseArgsOptionsConfig } from "node:util";
import type { RenderScale } from "@yumekit/render";

export type ParsedOptions = ReturnType<typeof parseArgs>;

export type Parsed<Value> =
  { ok: true; value: Value } | { ok: false; message: string };

export function parseCommandLine(options: {
  args: string[];
  config: ParseArgsOptionsConfig;
}): Parsed<{ values: ParsedOptions["values"]; positionals: string[] }> {
  try {
    const parsed = parseArgs({
      args: options.args,
      options: options.config,
      allowPositionals: true,
      strict: true,
    });
    return {
      ok: true,
      value: { values: parsed.values, positionals: parsed.positionals },
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export function stringOption(options: {
  values: ParsedOptions["values"];
  name: string;
}): string | undefined {
  const value = options.values[options.name];
  return typeof value === "string" ? value : undefined;
}

export function stringListOption(options: {
  values: ParsedOptions["values"];
  name: string;
}): string[] {
  const value = options.values[options.name];
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === "string")
    : [];
}

export function wholeNumberOption(options: {
  values: ParsedOptions["values"];
  name: string;
}): Parsed<number | undefined> {
  const text = stringOption(options);
  if (text === undefined) return { ok: true, value: undefined };
  const value = Number(text);
  return Number.isInteger(value) && value >= 0 && /^\d+$/.test(text)
    ? { ok: true, value }
    : {
        ok: false,
        message: `--${options.name} must be a whole number of 0 or more, not "${text}".`,
      };
}

const renderScales = [0.25, 0.5, 1] as const;

export function scaleOption(
  values: ParsedOptions["values"],
): Parsed<RenderScale | undefined> {
  const text = stringOption({ values, name: "scale" });
  if (text === undefined) return { ok: true, value: undefined };
  const scale = renderScales.find((candidate) => String(candidate) === text);
  return scale === undefined
    ? { ok: false, message: `--scale must be 0.25, 0.5, or 1, not "${text}".` }
    : { ok: true, value: scale };
}
