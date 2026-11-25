import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";
import { connectToMcp } from "../../testing/connectToMcp.js";
import { receiveEngineEvents } from "../../testing/engineEvents.js";
import { createCliWorkspace } from "../../testing/runCli.js";
import { runOpen } from "../../testing/runOpen.js";

const titleScene = {
  scene_id: "intro",
  title: "Intro",
  kit_component: "title-card",
  props: { heading: "Over the bridge" },
};

async function bridgeToOpenEngine() {
  const workspace = await createCliWorkspace({ home: "user" });
  const folder = join(workspace.root, "project");
  await workspace.run(["init", folder, "--output", "wide:320x180"]);
  const open = await runOpen({ folder, environment: workspace.environment });
  const events = await receiveEngineEvents(open);
  const connection = await connectToMcp({
    folder,
    environment: workspace.environment,
  });
  return { open, events, connection };
}

describe("yumekit mcp with a running engine", () => {
  it("lists the tools and the instructions of the engine", async () => {
    const { connection } = await bridgeToOpenEngine();

    const { tools } = await connection.client.listTools();

    expect(tools).toHaveLength(72);
    expect(tools.map((tool) => tool.name)).toContain("put_scene");
    expect(connection.client.getInstructions()).toContain("get_scene_guide");
    expect(connection.transportErrors).toEqual([]);
  });

  it("sends an edit to the engine, so the engine WebSocket sends project-changed", async () => {
    const { open, events, connection } = await bridgeToOpenEngine();

    const result = CallToolResultSchema.parse(
      await connection.client.callTool({
        name: "put_scene",
        arguments: titleScene,
      }),
    );
    const changed = await events.waitFor("project-changed");
    const project = await fetch(`${open.origin}/api/project`, {
      headers: { authorization: `Bearer ${open.token}` },
    });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({ scene_id: "intro" });
    expect(JSON.parse(changed)).toEqual({
      type: "project-changed",
      revision: 1,
    });
    expect(await project.json()).toMatchObject({
      scenes: [{ id: "intro" }],
    });
  });

  it("gives a failed tool and a missing tool back as an error result", async () => {
    const { connection } = await bridgeToOpenEngine();

    const failed = CallToolResultSchema.parse(
      await connection.client.callTool({
        name: "get_scene",
        arguments: { scene_id: "missing" },
      }),
    );
    const missing = CallToolResultSchema.parse(
      await connection.client.callTool({ name: "no_such_tool" }),
    );

    expect(failed.isError).toBe(true);
    expect(missing.isError).toBe(true);
    expect(JSON.stringify(missing.content)).toContain(
      "Tool no_such_tool not found",
    );
  });

  it("sends the progress of a render from the engine as MCP progress", async () => {
    const { connection } = await bridgeToOpenEngine();
    await connection.client.callTool({
      name: "put_scene",
      arguments: titleScene,
    });
    await connection.client.callTool({
      name: "set_timeline",
      arguments: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              {
                id: "a",
                scene_id: "intro",
                start_frame: 0,
                duration_frames: 6,
              },
            ],
          },
        ],
      },
    });
    const progress: { progress: number; total?: number | undefined }[] = [];

    const rendered = CallToolResultSchema.parse(
      await connection.client.callTool(
        {
          name: "render_video",
          arguments: { output_id: "wide", scale: 0.25 },
        },
        undefined,
        {
          onprogress: (update) => progress.push(update),
          timeout: 120_000,
        },
      ),
    );

    expect(rendered.isError).not.toBe(true);
    expect(progress.at(-1)).toMatchObject({ progress: 6, total: 6 });
  });

  it("stops when the engine stops", async () => {
    const { open, connection } = await bridgeToOpenEngine();

    await open.stop();
    const deadline = Date.now() + 10_000;
    while (
      !connection.stderr().includes("engine stopped") &&
      Date.now() < deadline
    ) {
      await delay(50);
    }

    expect(connection.stderr()).toContain("yumekit: the engine stopped.");
  });
});
