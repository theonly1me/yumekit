import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it, onTestFinished } from "vitest";
import { everyToolCall } from "../testing/everyToolCall.js";
import { startFunctionHarness } from "../testing/functionHarness.js";
import { startHarness, type ToolCall } from "../testing/harnessFixture.js";

const runFile = promisify(execFile);

async function sourceImage(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), "yumekit-source-"));
  onTestFinished(() => rm(folder, { recursive: true, force: true }));
  const path = join(folder, "Logo.png");
  await runFile("ffmpeg", [
    ...["-v", "error", "-f", "lavfi", "-i", "color=c=red:s=64x48"],
    ...["-frames:v", "1", path],
  ]);
  return path;
}

function resultOverMcp(call: ToolCall) {
  const { content } = call.result;
  return {
    isError: call.isError,
    text: content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("\n"),
    data: call.data,
    images: content.flatMap((block) =>
      block.type === "image"
        ? [{ mimeType: block.mimeType, base64: block.data }]
        : [],
    ),
    mcpResult: call.result,
  };
}

function withoutFolder(options: { value: object; folder: string }): unknown {
  return JSON.parse(
    JSON.stringify(options.value).replaceAll(options.folder, "<project>"),
  );
}

describe("createHarness and createHarnessServer", () => {
  it("list the same tools with the same descriptions and input schemas", async () => {
    const overMcp = await startHarness();
    const { harness } = await startFunctionHarness();

    const { tools } = await overMcp.client.listTools();

    expect(harness.tools).toEqual(
      tools.map(({ name, description, inputSchema, annotations }) => ({
        name,
        description,
        inputSchema,
        ...(annotations === undefined ? {} : { annotations }),
      })),
    );
  });

  it("give the same result for each tool of the full tool list", async () => {
    const overMcp = await startHarness();
    const direct = await startFunctionHarness();
    const calls = everyToolCall(await sourceImage());

    for (const { name, input } of calls) {
      const expected = resultOverMcp(
        await overMcp.call({ name, arguments: input }),
      );
      const actual = await direct.harness.call({ name, input });

      expect({
        name,
        result: withoutFolder({ value: actual, folder: direct.store.folder }),
      }).toEqual({
        name,
        result: withoutFolder({ value: expected, folder: overMcp.folder }),
      });
    }
    expect(new Set(calls.map((call) => call.name))).toEqual(
      new Set(direct.harness.tools.map((tool) => tool.name)),
    );
  }, 300_000);
});
