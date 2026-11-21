import { realpath } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { connectToMcp } from "../../testing/connectToMcp.js";
import { receiveEngineEvents } from "../../testing/engineEvents.js";
import { builtMainFile, createCliWorkspace } from "../../testing/runCli.js";
import { runOpen, type OpenRun } from "../../testing/runOpen.js";

async function agentsOf(open: OpenRun): Promise<unknown> {
  const response = await fetch(`${open.origin}/api/agents`, {
    headers: { authorization: `Bearer ${open.token}` },
  });
  return response.json();
}

describe("the agents of yumekit open", () => {
  it("gives the full server command, and counts a bridge while it is open", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "project");
    await workspace.run(["init", folder, "--output", "wide:320x180"]);
    const open = await runOpen({ folder, environment: workspace.environment });
    const events = await receiveEngineEvents(open);
    expect(await agentsOf(open)).toMatchObject({
      connected: 0,
      serverCommand: {
        command: process.execPath,
        args: [
          await realpath(builtMainFile),
          "mcp",
          "--project",
          await realpath(folder),
        ],
      },
    });

    const connection = await connectToMcp({
      folder,
      environment: workspace.environment,
    });
    await events.waitFor('{"type":"agents-changed","connected":1}');
    expect(await agentsOf(open)).toMatchObject({ connected: 1 });

    await connection.client.close();
    await events.waitFor('{"type":"agents-changed","connected":0}');
    expect(await agentsOf(open)).toMatchObject({ connected: 0 });
  });
});
