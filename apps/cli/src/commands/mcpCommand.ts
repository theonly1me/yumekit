import { resolve } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { findRunningEngine } from "@yumekit/engine";
import { createHarnessServer } from "@yumekit/harness-mcp";
import { openProject } from "@yumekit/project";
import { connectMediaTools, findBundledServers } from "@yumekit/tools";
import { failed, usageError, type CommandResult } from "../commandResult.js";
import { stopOnEnd } from "../ending/stopOnEnd.js";
import { parseCommandLine, stringOption } from "../options.js";
import { serveBridge } from "./bridge/serveBridge.js";

function keepStdoutForMessages(): void {
  console.log = console.error;
  console.info = console.error;
  console.debug = console.error;
}

export async function mcpCommand(args: string[]): Promise<CommandResult> {
  const parsed = parseCommandLine({
    args,
    config: { project: { type: "string" }, helper: { type: "string" } },
  });
  if (!parsed.ok) return usageError(parsed.message);
  const projectArgument = stringOption({
    values: parsed.value.values,
    name: "project",
  });
  if (projectArgument === undefined || parsed.value.positionals.length > 0) {
    return usageError("mcp needs --project <folder>.");
  }
  const helperToken = stringOption({
    values: parsed.value.values,
    name: "helper",
  });
  keepStdoutForMessages();
  const folder = resolve(projectArgument);
  const runningEngine = await findRunningEngine(folder);
  if (runningEngine !== undefined) {
    return serveBridge({ engine: runningEngine, helperToken });
  }
  const opened = await openProject({ folder });
  if (!opened.ok) return failed(opened.failure.message);
  const connected = await connectMediaTools({
    projectFolder: folder,
    bundledServers: await findBundledServers(),
  });
  if (!connected.ok) {
    return failed(
      `${connected.failure.file} is not valid: ${connected.failure.message}`,
    );
  }
  const mediaTools = connected.value;
  for (const failedServer of mediaTools.failedServers()) {
    process.stderr.write(
      `yumekit: the media server "${failedServer.server}" did not start: ${failedServer.message}\n`,
    );
  }
  const server = createHarnessServer({ store: opened.value, mediaTools });
  await server.connect(new StdioServerTransport());
  stopOnEnd({
    close: async () => {
      await server.close();
      await mediaTools.close();
    },
    endsWithInput: true,
  });
  return { kind: "serving" };
}
