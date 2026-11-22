import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { renderSceneFrame, type RenderScale } from "@yumekit/render";
import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { idInput, scaleInput } from "../inputs.js";
import { findScene } from "../lookups.js";
import { failureResult } from "../results.js";
import { renderFailureOf } from "./renderFailures.js";

const defaultPreviewScale = 0.25;
const sceneAloneSeconds = 3;
const settledShare = 0.75;

export function sceneAloneFrames(framesPerSecond: number): {
  durationFrames: number;
  frame: number;
} {
  const durationFrames = Math.round(framesPerSecond * sceneAloneSeconds);
  return {
    durationFrames,
    frame: Math.min(
      durationFrames - 1,
      Math.round(durationFrames * settledShare),
    ),
  };
}

async function sceneStillsResult(options: {
  context: HarnessContext;
  outputId: string;
  sceneIds: string[];
  scale: RenderScale;
}): Promise<CallToolResult> {
  const { context, outputId, sceneIds, scale } = options;
  const snapshot = context.store.read();
  for (const sceneId of sceneIds) {
    const found = findScene({ snapshot, sceneId });
    if (!found.ok) return failureResult(found.failure);
  }
  const { durationFrames, frame } = sceneAloneFrames(
    snapshot.project.framesPerSecond,
  );
  const images: { type: "image"; data: string; mimeType: string }[] = [];
  const pictures: {
    scene_id: string;
    frame: number;
    width_pixels: number;
    height_pixels: number;
  }[] = [];
  for (const sceneId of sceneIds) {
    const rendered = await renderSceneFrame({
      folder: context.store.folder,
      outputId,
      sceneId,
      durationFrames,
      frame,
      scale,
    });
    if (!rendered.ok) return failureResult(renderFailureOf(rendered.failure));
    images.push({
      type: "image",
      data: Buffer.from(rendered.value.png).toString("base64"),
      mimeType: "image/png",
    });
    pictures.push({
      scene_id: sceneId,
      frame,
      width_pixels: rendered.value.widthPixels,
      height_pixels: rendered.value.heightPixels,
    });
  }
  return {
    content: [
      {
        type: "text",
        text: `Scenes ${sceneIds.join(", ")} alone in "${outputId}" at scale ${String(scale)}, in this order.`,
      },
      ...images,
    ],
    structuredContent: { output_id: outputId, scale, pictures },
  };
}

export function registerScenePreviewTool(context: HarnessContext): void {
  context.tools.add({
    name: "preview_scenes",
    description:
      "Draw 1 to 8 scenes alone at the size of an output and return one PNG image for each, in the order given. A scene needs no clip. Each scene is drawn as a clip of 3 seconds, at the frame 75% into it. Default scale 0.25.",
    inputSchema: {
      output_id: idInput("The id of the output that gives the size."),
      scene_ids: z
        .array(idInput("The id of a scene."))
        .min(1)
        .max(8)
        .describe("1 to 8 scene ids (see get_project)."),
      scale: scaleInput,
    },
    annotations: { readOnlyHint: true },
    run: ({ input: { output_id, scene_ids, scale } }) =>
      sceneStillsResult({
        context,
        outputId: output_id,
        sceneIds: scene_ids,
        scale: scale ?? defaultPreviewScale,
      }),
  });
}
