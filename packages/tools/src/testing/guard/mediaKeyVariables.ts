import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { listServerKeys } from "../../listServerKeys.js";
import type { ServerCommand } from "../../types.js";

const toolsFolder = fileURLToPath(
  new URL("../../../../../tools", import.meta.url),
);

async function isFile(path: string): Promise<boolean> {
  return stat(path).then(
    (found) => found.isFile(),
    () => false,
  );
}

async function toolServers(): Promise<Record<string, ServerCommand>> {
  const servers: Record<string, ServerCommand> = {};
  for (const folder of await readdir(toolsFolder)) {
    const mainFile = join(toolsFolder, folder, "src", "main.ts");
    if (await isFile(mainFile)) {
      servers[folder] = { command: process.execPath, args: [mainFile] };
    }
  }
  return servers;
}

export async function mediaKeyVariablesOf(): Promise<string[]> {
  const listed = await listServerKeys({ bundledServers: await toolServers() });
  if (!listed.ok) throw new Error(listed.failure.message);
  const failed = listed.value.filter((server) => server.status === "failed");
  if (failed.length > 0) {
    throw new Error(
      `The test guard cannot read the keys of ${failed.map((server) => server.server).join(", ")}, so it cannot keep the tests away from paid services.`,
    );
  }
  return [
    ...new Set(
      listed.value.flatMap((server) =>
        server.status === "described"
          ? server.keys.map((key) => key.variable)
          : [],
      ),
    ),
  ];
}
