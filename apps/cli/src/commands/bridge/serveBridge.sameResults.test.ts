import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { connectToMcp } from "../../testing/connectToMcp.js";
import { everyToolCall } from "../../testing/everyToolCall.js";
import { createCliWorkspace } from "../../testing/runCli.js";
import { runOpen } from "../../testing/runOpen.js";

const runFile = promisify(execFile);

function withoutFolder(options: { value: unknown; folder: string }): unknown {
  const value: unknown = JSON.parse(
    JSON.stringify(options.value).replaceAll(options.folder, "<project>"),
  );
  return value;
}

async function twoProjects() {
  const workspace = await createCliWorkspace({ home: "user" });
  const folders = {
    bridged: join(workspace.root, "bridged", "project"),
    direct: join(workspace.root, "direct", "project"),
  };
  for (const folder of Object.values(folders)) {
    await mkdir(join(folder, ".."), { recursive: true });
    await workspace.run(["init", folder, "--output", "wide:320x180"]);
  }
  const sourceImage = join(workspace.root, "Logo.png");
  await runFile("ffmpeg", [
    ...["-v", "error", "-f", "lavfi", "-i", "color=c=red:s=64x48"],
    ...["-frames:v", "1", sourceImage],
  ]);
  await runOpen({
    folder: folders.bridged,
    environment: workspace.environment,
  });
  const bridged = await connectToMcp({
    folder: folders.bridged,
    environment: workspace.environment,
  });
  const direct = await connectToMcp({
    folder: folders.direct,
    environment: workspace.environment,
  });
  return { folders, bridged, direct, sourceImage };
}

describe("yumekit mcp through a running engine and without one", () => {
  it("give the same tool list, instructions, and result for each tool of the full tool list, a missing tool, and an invalid input", async () => {
    const { folders, bridged, direct, sourceImage } = await twoProjects();

    const bridgedTools = await bridged.client.listTools();
    const directTools = await direct.client.listTools();
    expect(bridgedTools).toEqual(directTools);
    expect(bridged.client.getInstructions()).toBe(
      direct.client.getInstructions(),
    );

    const calls = everyToolCall(sourceImage);
    for (const { name, input } of [
      { name: "no_such_tool", input: {} },
      { name: "get_scene", input: { scene_id: 5 } },
      ...calls,
    ]) {
      const expected = await direct.client.callTool(
        { name, arguments: input },
        undefined,
        { timeout: 120_000 },
      );
      const actual = await bridged.client.callTool(
        { name, arguments: input },
        undefined,
        { timeout: 120_000 },
      );

      expect({
        name,
        result: withoutFolder({ value: actual, folder: folders.bridged }),
      }).toEqual({
        name,
        result: withoutFolder({ value: expected, folder: folders.direct }),
      });
    }
    expect(new Set(calls.map((call) => call.name))).toEqual(
      new Set(directTools.tools.map((tool) => tool.name)),
    );
  }, 400_000);
});
