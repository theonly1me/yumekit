import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { renderFrame, type RenderScale } from "@yumekit/render";
import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { frameInput, idInput, scaleInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { renderFailureOf } from "./renderFailures.js";

const defaultPreviewScale = 0.25;

async function previewResult(options: {
  context: HarnessContext;
  outputId: string;
  frames: number[];
  scale: RenderScale;
}): Promise<CallToolResult> {
  const { context, outputId, frames, scale } = options;
  const images: { type: "image"; data: string; mimeType: string }[] = [];
  const pictures: {
    frame: number;
    width_pixels: number;
    height_pixels: number;
  }[] = [];
  for (const frame of frames) {
    const rendered = await renderFrame({
      folder: context.store.folder,
      outputId,
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
      frame,
      width_pixels: rendered.value.widthPixels,
      height_pixels: rendered.value.heightPixels,
    });
  }
  return {
    content: [
      {
        type: "text",
        text: `Frames ${frames.join(", ")} of "${outputId}" at scale ${String(scale)}, in this order.`,
      },
      ...images,
    ],
    structuredContent: { output_id: outputId, scale, pictures },
  };
}

export function registerPreviewTools(context: HarnessContext): void {
  context.server.registerTool(
    "preview_frame",
    {
      description:
        "Draw one frame of an output and return it as a PNG image. Use it after each scene to check layout, text that does not fit, and missing images. Default scale 0.25.",
      inputSchema: {
        output_id: idInput("The id of the output."),
        frame: frameInput(
          "The frame of the output, from 0 to length_frames - 1 (see get_project).",
        ),
        scale: scaleInput,
      },
      annotations: { readOnlyHint: true },
    },
    ({ output_id, frame, scale }) =>
      previewResult({
        context,
        outputId: output_id,
        frames: [frame],
        scale: scale ?? defaultPreviewScale,
      }),
  );
  context.server.registerTool(
    "preview_frames",
    {
      description:
        "Draw 1 to 8 frames of an output and return one PNG image for each, in the order given. Pick a frame inside each scene, for example where its motion has settled. Use it before each render. Default scale 0.25.",
      inputSchema: {
        output_id: idInput("The id of the output."),
        frames: z
          .array(frameInput("A frame of the output."))
          .min(1)
          .max(8)
          .describe(
            "1 to 8 frames of the output, each from 0 to length_frames - 1.",
          ),
        scale: scaleInput,
      },
      annotations: { readOnlyHint: true },
    },
    ({ output_id, frames, scale }) =>
      previewResult({
        context,
        outputId: output_id,
        frames,
        scale: scale ?? defaultPreviewScale,
      }),
  );
}
