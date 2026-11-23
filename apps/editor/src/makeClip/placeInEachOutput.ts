import type { EngineClient } from "../engine/engineClient.js";
import type { Output } from "../engine/snapshot.js";
import { callTool, textField, type ToolFailure } from "./toolCalls.js";

export async function placeInEachOutput(options: {
  client: EngineClient;
  assetId: string;
  clipId: string;
  outputs: [Output, ...Output[]];
  actId: string;
}): Promise<
  { ok: true; sceneClipId: string } | { ok: false; failure: ToolFailure }
> {
  const sceneClipIds: string[] = [];
  for (const output of options.outputs) {
    const placed = await callTool({
      client: options.client,
      name: "place_video",
      actId: options.actId,
      input: {
        output_id: output.id,
        asset_id: options.assetId,
        replace_clip_id: options.clipId,
      },
    });
    if (!placed.ok) return placed;
    sceneClipIds.push(textField({ data: placed.data, name: "scene_clip_id" }));
  }
  const [sceneClipId = ""] = sceneClipIds;
  return { ok: true, sceneClipId };
}
