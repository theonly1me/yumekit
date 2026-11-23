import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { cameraMoveIds, findCameraMove } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

const falServerCommand = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL("../../../../tools/fal-media/src/main.ts", import.meta.url),
    ),
  ],
};

const orbitSentence =
  "The camera orbits slowly around the subject in a smooth arc, keeping the subject centered in frame.";

function makeStill(options: { harness: Harness; assetId: string }) {
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: options.assetId,
      capability: "image",
      input: { prompt: options.assetId, width_pixels: 64, height_pixels: 36 },
    },
  });
}

function makeClip(options: {
  harness: Harness;
  extra: Record<string, unknown>;
  assetId?: string;
}) {
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: options.assetId ?? "clip",
      capability: "video",
      input: { prompt: "A fox runs", duration_seconds: 1 },
      ...options.extra,
    },
  });
}

describe("generate_asset with camera_move", () => {
  it("sends the sentence of the move at the end of the prompt, and records the id", async () => {
    const harness = await startHarness();

    const result = await makeClip({ harness, extra: { camera_move: "orbit" } });

    expect(result.isError).toBe(false);
    expect(findCameraMove("orbit")?.sentence).toBe(orbitSentence);
    expect(harness.runRequests.at(-1)?.input["prompt"]).toBe(
      `A fox runs\n\n${orbitSentence}`,
    );
    expect(harness.store.read().assets[0]?.source).toMatchObject({
      input: { prompt: "A fox runs", camera_move: "orbit" },
    });
  });

  it("makes a new clip for another move, and reuses the clip for the same move", async () => {
    const harness = await startHarness();
    await makeClip({ harness, extra: { camera_move: "orbit" } });

    const other = await makeClip({
      harness,
      assetId: "clip-2",
      extra: { camera_move: "push-in" },
    });
    const same = await makeClip({
      harness,
      assetId: "clip-3",
      extra: { camera_move: "push-in" },
    });

    expect(other.data["reused"]).toBe(false);
    expect(same.data["reused"]).toBe(true);
    expect(harness.runRequests).toHaveLength(2);
  });

  it("fails with camera-move-not-found and the list of ids for an unknown move, and calls no tool", async () => {
    const harness = await startHarness();

    const result = await makeClip({ harness, extra: { camera_move: "spin" } });

    expect(result.data).toMatchObject({
      kind: "camera-move-not-found",
      hint: `Use one of these camera moves: ${cameraMoveIds.join(", ")}. Or leave out camera_move.`,
    });
    expect(harness.runRequests).toHaveLength(0);
  });

  it("refuses camera_move for a picture", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "still",
        capability: "image",
        input: { prompt: "a fox" },
        camera_move: "orbit",
      },
    });

    expect(result.data["kind"]).toBe("invalid-value");
    expect(harness.runRequests).toHaveLength(0);
  });
});

describe("generate_asset with last_frame_asset_id", () => {
  it("passes the path of the picture as last_frame_path to a model that accepts a last picture", async () => {
    const harness = await startHarness();
    await makeStill({ harness, assetId: "start" });
    await makeStill({ harness, assetId: "end" });

    const result = await makeClip({
      harness,
      extra: { first_frame_asset_id: "start", last_frame_asset_id: "end" },
    });

    expect(result.isError).toBe(false);
    const files = join(harness.folder, "assets", "files");
    expect(harness.runRequests.at(-1)?.input).toMatchObject({
      first_frame_path: join(files, "start.png"),
      last_frame_path: join(files, "end.png"),
    });
    expect(harness.store.read().assets.at(-1)?.source).toMatchObject({
      input: { last_frame_asset_id: "end" },
    });
  });

  it("fails and names the model when the model takes no last picture", async () => {
    const harness = await startHarness({
      mediaToolsFile: { mcpServers: { fal: falServerCommand } },
    });
    await makeStill({ harness, assetId: "start" });
    await makeStill({ harness, assetId: "end" });
    const requestsBefore = harness.runRequests.length;

    const result = await makeClip({
      harness,
      extra: {
        server: "fal",
        model: "fal-ai/pixverse/v6",
        first_frame_asset_id: "start",
        last_frame_asset_id: "end",
      },
    });

    expect(result.data).toMatchObject({
      kind: "invalid-value",
      message: "The video model fal-ai/pixverse/v6 takes no last picture.",
    });
    expect(harness.runRequests).toHaveLength(requestsBefore);
  });
});
