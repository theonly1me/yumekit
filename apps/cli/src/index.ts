import { createRequire } from "node:module";
import { z } from "zod";

export const version = z
  .object({ version: z.string() })
  .parse(createRequire(import.meta.url)("../package.json")).version;

export function formatVersion(versionNumber: string): string {
  return `yumekit ${versionNumber}\n`;
}
