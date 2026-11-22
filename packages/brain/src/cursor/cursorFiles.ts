import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { serverName, type ServerCommand } from "../brainTypes.js";

export interface CursorFolders {
  agentFolder: string;
  configurationFolder: string;
}

export const cursorPermissions = {
  permissions: {
    allow: [`Mcp(${serverName}:*)`],
    deny: [
      "Shell(*)",
      "Write(**)",
      "Write(/**)",
      "Read(**)",
      "Read(/**)",
      "WebFetch(*)",
    ],
  },
};

export function cursorFoldersOf(workingFolder: string): CursorFolders {
  const yumekitFolder = dirname(workingFolder);
  return {
    agentFolder: join(yumekitFolder, "agent-cursor"),
    configurationFolder: join(yumekitFolder, "agent-cursor-config"),
  };
}

function jsonText(value: object): string {
  return `${JSON.stringify(value, undefined, 2)}\n`;
}

export async function writeCursorFiles(options: {
  folders: CursorFolders;
  instructions: string;
  serverCommand: ServerCommand;
}): Promise<void> {
  const cursorFolder = join(options.folders.agentFolder, ".cursor");
  const rulesFolder = join(cursorFolder, "rules");
  await mkdir(rulesFolder, { recursive: true });
  await mkdir(options.folders.configurationFolder, { recursive: true });
  const serverConfiguration = {
    mcpServers: {
      [serverName]: {
        type: "stdio",
        command: options.serverCommand.command,
        args: options.serverCommand.args,
      },
    },
  };
  await writeFile(
    join(cursorFolder, "mcp.json"),
    jsonText(serverConfiguration),
  );
  await writeFile(join(cursorFolder, "cli.json"), jsonText(cursorPermissions));
  await writeFile(
    join(rulesFolder, `${serverName}.mdc`),
    `---\nalwaysApply: true\n---\n\n${options.instructions}\n`,
  );
}
