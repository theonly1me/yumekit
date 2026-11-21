import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startEngine, type Engine } from "@yumekit/engine";
import { failed, usageError, type CommandResult } from "../../commandResult.js";
import { parseCommandLine, wholeNumberOption } from "../../options.js";
import { realFolderOf, serverCommandOf } from "../../serverCommand.js";
import { openBrowser } from "./openBrowser.js";

const builtEditorFolder = fileURLToPath(
  new URL("../../../../editor/dist/", import.meta.url),
);

function closeOnSignal(engine: Engine): void {
  let isClosing = false;
  const close = () => {
    if (isClosing) return;
    isClosing = true;
    engine
      .close()
      .then(() => {
        process.stdout.write("yumekit: the engine stopped.\n");
        process.exit(0);
      })
      .catch((error: unknown) => {
        process.stderr.write(`yumekit: ${String(error)}\n`);
        process.exit(1);
      });
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
}

function showUrl(options: { url: string; withBrowser: boolean }): void {
  if (options.withBrowser) openBrowser(options.url);
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
  const port = wholeNumberOption({ values, name: "port" });
  if (!port.ok) return usageError(port.message);
  if (port.value !== undefined && port.value > 65_535) {
    return usageError("--port must be 65535 or less.");
  }
  const withBrowser = values["no-browser"] !== true;
  const started = await startEngine({
    projectFolder: resolve(folder),
    editorFolder: builtEditorFolder,
    serverCommand: serverCommandOf(await realFolderOf(folder)),
    ...(port.value === undefined ? {} : { port: port.value }),
  });
  if (!started.ok) {
    const { failure } = started;
    switch (failure.kind) {
      case "engine-already-running":
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
  closeOnSignal(engine);
  process.stdout.write(
    `The editor runs at:\n${engine.url}\nPress Ctrl+C to stop the engine.\n`,
  );
  showUrl({ url: engine.url, withBrowser });
  return { kind: "serving" };
}
