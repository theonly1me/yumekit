import { resolve } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createHarnessServer } from "@yumekit/harness-mcp";
import { openProject } from "@yumekit/project";
import { connectMediaTools } from "@yumekit/tools";
import { findBundledServers } from "../bundledServers.js";
import { failed, usageError, type CommandResult } from "../commandResult.js";
import { parseCommandLine, stringOption } from "../options.js";

function keepStdoutForMessages(): void {
  console.log = console.error;
  console.info = console.error;
  console.debug = console.error;
}

export async function mcpCommand(args: string[]): Promise<CommandResult> {
  const parsed = parseCommandLine({
    args,
    config: { project: { type: "string" } },
  });
  if (!parsed.ok) return usageError(parsed.message);
  const projectArgument = stringOption({
    values: parsed.value.values,
    name: "project",
  });
  if (projectArgument === undefined || parsed.value.positionals.length > 0) {
    return usageError("mcp needs --project <folder>.");
  }
  keepStdoutForMessages();
  const folder = resolve(projectArgument);
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
  server.server.onclose = () => {
    mediaTools.close().catch((error: unknown) => {
      process.stderr.write(`yumekit: ${String(error)}\n`);
    });
  };
  await server.connect(new StdioServerTransport());
  return { kind: "serving" };
}
