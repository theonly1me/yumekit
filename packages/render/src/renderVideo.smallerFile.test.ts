import { execFile } from "node:child_process";
import { access, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { renderVideo, type SmallerFileChoice } from "./index.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
  temporaryFolder,
} from "./testing/renderProject.js";
import { addToneAsset } from "./testing/toneWav.js";

const runFile = promisify(execFile);
const outputFrames = 60;

const noiseCode = `import { defineReactScene, useFrame } from "@yumekit/scene";

export default defineReactScene(() => {
  const frame = useFrame();
  const cells = Array.from({ length: 3600 }, (_, index) => Math.abs((index * 2654435761) ^ (frame * 40503 + index * 977)) % 256);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexWrap: "wrap" }}>
      {cells.map((gray, index) => (
        <div key={index} style={{ width: 4, height: 4, background: "rgb(" + gray + "," + gray + "," + gray + ")" }} />
      ))}
    </div>
  );
});
`;

function noiseProject(): Promise<string> {
  return createRenderProject({
    edits: async (store) => [
      moduleScene({ sceneId: "noise", code: noiseCode }),
      await addToneAsset({
        folder: store.folder,
        assetId: "tone",
        durationFrames: outputFrames,
      }),
      sceneTracks({
        tracks: [
          [
            {
              id: "noise",
              sceneId: "noise",
              startFrame: 0,
              durationFrames: outputFrames,
            },
          ],
        ],
        audioClips: [
          {
            id: "tone",
            assetId: "tone",
            startFrame: 0,
            durationFrames: outputFrames,
            assetStartFrame: 0,
            gainDecibels: 0,
          },
        ],
      }),
    ],
  });
}

async function renderSmaller(smallerFile: SmallerFileChoice) {
  const folder = await noiseProject();
  const destination = join(await temporaryFolder(), "smaller.mp4");
  const rendered = await renderVideo({
    folder,
    outputId: "wide",
    destination,
    smallerFile,
  });
  return { rendered, destination };
}

const streamsSchema = z.object({
  streams: z.array(
    z.object({
      codec_type: z.string(),
      codec_name: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
      bit_rate: z.coerce.number(),
    }),
  ),
});

async function streamsOf(file: string) {
  const { stdout } = await runFile("ffprobe", [
    ...["-v", "error", "-of", "json"],
    ...["-show_entries", "stream=codec_type,codec_name,width,height,bit_rate"],
    file,
  ]);
  return streamsSchema.parse(JSON.parse(stdout)).streams;
}

describe("renderVideo with a smaller file", () => {
  it("stays under the asked size for a picture that needs many more bytes, with the same picture size, AAC sound, and the index at the start", async () => {
    const { rendered, destination } = await renderSmaller({
      largestMegabytes: 0.2,
    });
    const bytes = (await stat(destination)).size;
    const content = await readFile(destination);

    expect(rendered).toMatchObject({
      ok: true,
      value: { file: destination, widthPixels: 320, heightPixels: 180 },
    });
    expect(bytes).toBeLessThanOrEqual(200_000);
    expect(await streamsOf(destination)).toEqual([
      expect.objectContaining({
        codec_type: "video",
        codec_name: "h264",
        width: 320,
        height: 180,
      }),
      expect.objectContaining({ codec_type: "audio", codec_name: "aac" }),
    ]);
    expect(content.indexOf("moov")).toBeLessThan(content.indexOf("mdat"));
  });

  it("makes the picture smaller at the asked short side and keeps its shape", async () => {
    const { rendered, destination } = await renderSmaller({
      largestMegabytes: 0.3,
      shortSidePixels: 120,
    });

    expect(rendered).toMatchObject({
      ok: true,
      value: { widthPixels: 214, heightPixels: 120 },
    });
    expect(await streamsOf(destination)).toContainEqual(
      expect.objectContaining({ width: 214, height: 120 }),
    );
  });

  it("refuses a size that cannot hold the sound and the smallest video, and writes no file", async () => {
    const { rendered, destination } = await renderSmaller({
      largestMegabytes: 0.05,
    });

    expect(rendered).toMatchObject({
      ok: false,
      failure: {
        kind: "file-size-not-reached",
        largestMegabytes: 0.05,
        smallestMegabytes: 0.1,
      },
    });
    await expect(access(destination)).rejects.toThrow();
  });
});
