import { fileURLToPath } from "node:url";
import { usageError, type CommandResult } from "../../commandResult.js";
import { wholeNumberOption, type ParsedOptions } from "../../options.js";

export const builtEditorFolder = fileURLToPath(
  new URL("../../../../editor/dist/", import.meta.url),
);

export function portOption(
  values: ParsedOptions["values"],
):
  | { ok: true; port: number | undefined }
  | { ok: false; result: CommandResult } {
  const port = wholeNumberOption({ values, name: "port" });
  if (!port.ok) return { ok: false, result: usageError(port.message) };
  if (port.value !== undefined && port.value > 65_535) {
    return { ok: false, result: usageError("--port must be 65535 or less.") };
  }
  return { ok: true, port: port.value };
}
