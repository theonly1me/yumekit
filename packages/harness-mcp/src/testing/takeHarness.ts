import type { ProjectStore } from "@yumekit/project";
import type { Harness } from "../index.js";
import { jsonObjectInput } from "../inputs.js";
import { startFunctionHarness } from "./functionHarness.js";
import type { ToolCall, ToolCaller } from "./harnessFixture.js";
import type { HarnessProjectOptions } from "./harnessProject.js";

export interface TakeHarness extends ToolCaller {
  store: ProjectStore;
  folder: string;
  sendTake: Harness["sendTake"];
}

export async function startTakeHarness(
  options?: HarnessProjectOptions & {
    videoStyle?: "graphics" | "ai-video" | "mix";
  },
): Promise<TakeHarness> {
  const { harness, store } = await startFunctionHarness(options);
  const call = async (request: {
    name: string;
    arguments?: Record<string, unknown>;
  }): Promise<ToolCall> => {
    const result = await harness.call({
      name: request.name,
      input: jsonObjectInput.parse(request.arguments ?? {}),
    });
    return {
      isError: result.isError,
      data: { ...result.data },
      text: result.text,
      result: result.mcpResult,
    };
  };
  if (options?.videoStyle !== undefined) {
    await call({
      name: "set_video_style",
      arguments: { video_style: options.videoStyle },
    });
  }
  return { store, folder: store.folder, call, sendTake: harness.sendTake };
}

export function picture(assetId: string) {
  return {
    asset_id: assetId,
    capability: "image",
    input: { prompt: assetId, width_pixels: 32, height_pixels: 18 },
  };
}

export function clip(options: { assetId: string; from: string }) {
  return {
    asset_id: options.assetId,
    capability: "video",
    input: { prompt: options.assetId, duration_seconds: 1 },
    first_frame_asset_id: options.from,
  };
}

export async function readyPictures(options: {
  harness: TakeHarness;
  assetIds: string[];
}): Promise<ToolCall> {
  const { harness, assetIds } = options;
  await harness.call({ name: "open_take", arguments: { step: "pictures" } });
  await harness.call({
    name: "generate_assets",
    arguments: { calls: assetIds.map((assetId) => picture(assetId)) },
  });
  return harness.call({
    name: "ready_take",
    arguments: {
      items: assetIds.map((id) => ({ id, note: `The picture ${id}.` })),
    },
  });
}
