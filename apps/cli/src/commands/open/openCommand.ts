import { resolve } from "node:path";
import { recordRecentProject, startEngine } from "@yumekit/engine";
import { failed, usageError, type CommandResult } from "../../commandResult.js";
import { parseCommandLine } from "../../options.js";
import { realFolderOf, serverCommandOf } from "../../serverCommand.js";
import { openBrowser } from "./openBrowser.js";
import { builtEditorFolder, closeOnSignal, portOption } from "./serving.js";

function showUrl(options: { url: string; withBrowser: boolean }): void {
  if (options.withBrowser) openBrowser(options.url);
}

async function addToRecent(folder: string): Promise<void> {
  const recorded = await recordRecentProject({ folder });
  if (!recorded.ok) {
    process.stderr.write(
      `yumekit: the list of recent projects did not change: ${recorded.failure}\n`,
    );
  }
}

export async function openCommand(args: string[]): Promise<CommandResult> {
  const parsed = parseCommandLine({
    args,
    config: { port: { type: "string" }, "no-browser": { type: "boolean" } },
  });
  if (!parsed.ok) return usageError(parsed.message);
  const { values, positionals } = parsed.value;
  const [folder] = positionals;
  if (folder === undefined || positionals.length > 1) {
    return usageError("open needs one <folder>.");
  }
  const port = portOption(values);
  if (!port.ok) return port.result;
  const withBrowser = values["no-browser"] !== true;
  const realFolder = await realFolderOf(folder);
  const started = await startEngine({
    projectFolder: resolve(folder),
    editorFolder: builtEditorFolder,
    serverCommand: serverCommandOf(realFolder),
    ...(port.port === undefined ? {} : { port: port.port }),
  });
  if (!started.ok) {
    const { failure } = started;
    switch (failure.kind) {
      case "engine-already-running":
        await addToRecent(realFolder);
        showUrl({ url: failure.url, withBrowser });
        return {
          kind: "done",
          output: `An engine already runs for this project:\n${failure.url}\n`,
        };
      case "port-not-free":
        return failed(`The port ${String(failure.port)} is not free.`);
      case "project-invalid":
        return failed(failure.message);
    }
  }
  const engine = started.value;
  closeOnSignal({
    close: engine.close,
    stoppedLine: "yumekit: the engine stopped.",
  });
  await addToRecent(realFolder);
  process.stdout.write(
    `The editor runs at:\n${engine.url}\nPress Ctrl+C to stop the engine.\n`,
  );
  showUrl({ url: engine.url, withBrowser });
  return { kind: "serving" };
}
