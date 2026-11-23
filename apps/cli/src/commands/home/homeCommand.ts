import { startHomeServer } from "@yumekit/engine";
import { failed, usageError, type CommandResult } from "../../commandResult.js";
import { parseCommandLine } from "../../options.js";
import { serverCommandOf } from "../../serverCommand.js";
import { stopOnEnd } from "../../ending/stopOnEnd.js";
import { openBrowser } from "../open/openBrowser.js";
import { builtEditorFolder, portOption } from "../open/serving.js";

export async function homeCommand(args: string[]): Promise<CommandResult> {
  const parsed = parseCommandLine({
    args,
    config: { port: { type: "string" }, "no-browser": { type: "boolean" } },
  });
  if (!parsed.ok) return usageError(parsed.message);
  if (parsed.value.positionals.length > 0) {
    return usageError("yumekit with no command takes no folder.");
  }
  const port = portOption(parsed.value.values);
  if (!port.ok) return port.result;
  const started = await startHomeServer({
    editorFolder: builtEditorFolder,
    serverCommandOf,
    ...(port.port === undefined ? {} : { port: port.port }),
  });
  if (!started.ok) {
    return failed(`The port ${String(started.failure.port)} is not free.`);
  }
  const home = started.value;
  stopOnEnd({
    close: home.close,
    stoppedLine: "yumekit: stopped.",
  });
  process.stdout.write(
    `yumekit runs at:\n${home.url}\nPress Ctrl+C to stop yumekit.\n`,
  );
  if (parsed.value.values["no-browser"] !== true) openBrowser(home.url);
  return { kind: "serving" };
}
