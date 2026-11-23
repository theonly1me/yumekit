import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { RenderScale } from "@yumekit/render";
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
  const rendered = await context.pictures.renderFrames({
    outputId,
    frames,
    scale,
  });
  if (!rendered.ok) return failureResult(renderFailureOf(rendered.failure));
  rendered.value.forEach((...[picture, index]) => {
    images.push({
      type: "image",
      data: Buffer.from(picture.png).toString("base64"),
      mimeType: "image/png",
    });
    pictures.push({
      frame: frames[index] ?? 0,
      width_pixels: picture.widthPixels,
      height_pixels: picture.heightPixels,
    });
  });
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
  context.tools.add({
    name: "preview_frame",
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
    run: ({ input: { output_id, frame, scale } }) =>
      previewResult({
        context,
        outputId: output_id,
        frames: [frame],
        scale: scale ?? defaultPreviewScale,
      }),
  });
  context.tools.add({
    name: "preview_frames",
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
    run: ({ input: { output_id, frames, scale } }) =>
      previewResult({
        context,
        outputId: output_id,
        frames,
        scale: scale ?? defaultPreviewScale,
      }),
  });
}
