import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";
import {
  startHarness,
  type Harness,
  type ToolCall,
} from "../testing/harnessFixture.js";
import { pngSizeOf, probeVideo } from "../testing/probeVideo.js";

const renderTimeout = 120_000;

async function harnessWithTitle(): Promise<Harness> {
  const harness = await startHarness();
  await harness.call({
    name: "put_scene",
    arguments: {
      scene_id: "intro",
      title: "Intro",
      kit_component: "title-card",
      props: { heading: "Preview" },
    },
  });
  await harness.call({
    name: "set_timeline",
    arguments: {
      output_id: "wide",
      tracks: [
        {
          id: "main",
          kind: "scene",
          clips: [{ scene_id: "intro", start_frame: 0, duration_frames: 20 }],
        },
      ],
    },
  });
  return harness;
}

function imagesOf(call: ToolCall) {
  return call.result.content.flatMap((content) =>
    content.type === "image" ? [content] : [],
  );
}

describe("preview and render tools", () => {
  it(
    "preview_frame returns one PNG at scale 0.25 by default",
    async () => {
      const harness = await harnessWithTitle();

      const result = await harness.call({
        name: "preview_frame",
        arguments: { output_id: "wide", frame: 10 },
      });

      const [image, ...others] = imagesOf(result);
      expect(others).toEqual([]);
      expect(image?.mimeType).toBe("image/png");
      expect(pngSizeOf(image?.data ?? "")).toEqual({ width: 80, height: 45 });
    },
    renderTimeout,
  );

  it(
    "preview_frames returns one image for each frame, at the scale asked",
    async () => {
      const harness = await harnessWithTitle();

      const result = await harness.call({
        name: "preview_frames",
        arguments: { output_id: "wide", frames: [0, 19], scale: 0.5 },
      });

      const images = imagesOf(result);
      expect(images.map((image) => pngSizeOf(image.data))).toEqual([
        { width: 160, height: 90 },
        { width: 160, height: 90 },
      ]);
      expect(result.data).toMatchObject({
        pictures: [{ frame: 0 }, { frame: 19 }],
      });
    },
    renderTimeout,
  );

  it(
    "a frame past the end gives the frame count in the hint",
    async () => {
      const harness = await harnessWithTitle();

      const result = await harness.call({
        name: "preview_frame",
        arguments: { output_id: "wide", frame: 20 },
      });

      expect(result.data["kind"]).toBe("frame-out-of-range");
      expect(result.data["hint"]).toContain("numbered 0 to 19");
    },
    renderTimeout,
  );

  it(
    "render_still writes a full size PNG to renders",
    async () => {
      const harness = await harnessWithTitle();

      const result = await harness.call({
        name: "render_still",
        arguments: { output_id: "wide", frame: 5 },
      });

      const file = join(harness.folder, "renders", "wide-frame-5.png");
      expect(result.data).toEqual({
        file,
        width_pixels: 320,
        height_pixels: 180,
      });
      const bytes = await readFile(file);
      expect(pngSizeOf(bytes.toString("base64"))).toEqual({
        width: 320,
        height: 180,
      });
    },
    renderTimeout,
  );

  it(
    "render_video writes an MP4 and sends progress notifications",
    async () => {
      const harness = await harnessWithTitle();
      const progress: number[] = [];

      const result = CallToolResultSchema.parse(
        await harness.client.callTool(
          {
            name: "render_video",
            arguments: { output_id: "wide", scale: 0.5 },
          },
          undefined,
          {
            timeout: renderTimeout,
            onprogress: (notification) => progress.push(notification.progress),
          },
        ),
      );

      const file = join(harness.folder, "renders", "wide.mp4");
      expect(result.structuredContent).toEqual({
        file,
        files: [{ file }],
        frame_count: 20,
        duration_seconds: 20 / 30,
        width_pixels: 160,
        height_pixels: 90,
      });
      expect(progress.at(-1)).toBe(20);
      expect(await probeVideo(file)).toEqual([
        expect.objectContaining({
          codec_name: "h264",
          width: 160,
          height: 90,
          r_frame_rate: "30/1",
          nb_read_frames: "20",
        }),
      ]);
    },
    renderTimeout,
  );
});
