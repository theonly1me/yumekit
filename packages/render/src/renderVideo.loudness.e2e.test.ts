import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { renderVideo } from "./index.js";
import { decodeAudio, loudness } from "./testing/probe.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
  temporaryFolder,
} from "./testing/renderProject.js";
import { movingSquareCode } from "./testing/sceneCodes.js";
import { addToneAsset, toneWav } from "./testing/toneWav.js";
import { valueOf } from "./testing/valueOf.js";

const runFile = promisify(execFile);
const outputFrames = 120;

async function measured(file: string) {
  const { stderr } = await runFile("ffmpeg", [
    ...["-hide_banner", "-nostats", "-i", file, "-vn"],
    ...["-af", "loudnorm=print_format=json", "-f", "null", "-"],
  ]);
  const json: unknown = JSON.parse(
    stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1),
  );
  const valueOfField = (field: string) =>
    typeof json === "object" && json !== null
      ? Number(Reflect.get(json, field))
      : Number.NaN;
  return {
    integrated: valueOfField("input_i"),
    truePeak: valueOfField("input_tp"),
  };
}

function project(clips: { assetId: string; start: number; gain: number }[]) {
  return createRenderProject({
    edits: async (store) => [
      moduleScene({ sceneId: "square", code: movingSquareCode }),
      await addToneAsset({
        folder: store.folder,
        assetId: "voice",
        durationFrames: 60,
      }),
      await addToneAsset({
        folder: store.folder,
        assetId: "music",
        durationFrames: 60,
        content: toneWav({ seconds: 2, frequencyHertz: 220 }),
      }),
      sceneTracks({
        tracks: [
          [
            {
              id: "move",
              sceneId: "square",
              startFrame: 0,
              durationFrames: outputFrames,
            },
          ],
        ],
        audioClips: clips.map((clip) => ({
          id: `${clip.assetId}-${String(clip.start)}`,
          assetId: clip.assetId,
          startFrame: clip.start,
          durationFrames: 60,
          assetStartFrame: 0,
          gainDecibels: clip.gain,
        })),
      }),
    ],
  });
}

async function exported(folder: string): Promise<string> {
  const destination = join(await temporaryFolder(), "film.mp4");
  valueOf(
    await renderVideo({ folder, outputId: "wide", destination, scale: 0.25 }),
  );
  return destination;
}

describe("the loudness of an exported video", () => {
  it("brings quiet music up to -14 LUFS with a true peak under -1 dB", async () => {
    const folder = await project([
      { assetId: "music", start: 0, gain: -24 },
      { assetId: "music", start: 60, gain: -24 },
    ]);

    const level = await measured(await exported(folder));

    expect(Math.abs(level.integrated - -14)).toBeLessThanOrEqual(0.6);
    expect(level.truePeak).toBeLessThanOrEqual(-0.9);
  });

  it("keeps the balance between the voice and the music", async () => {
    const folder = await project([
      { assetId: "voice", start: 0, gain: 0 },
      { assetId: "music", start: 60, gain: -12 },
    ]);

    const samples = await decodeAudio(await exported(folder));
    const voice = loudness({ samples, fromSeconds: 0.5, toSeconds: 1.5 });
    const music = loudness({ samples, fromSeconds: 2.5, toSeconds: 3.5 });

    expect(20 * Math.log10(voice / music)).toBeCloseTo(12, 0);
  });

  it("gives the same sound on each export of the same project", async () => {
    const folder = await project([{ assetId: "music", start: 0, gain: -20 }]);

    const first = await decodeAudio(await exported(folder));
    const second = await decodeAudio(await exported(folder));

    expect(Buffer.from(first.buffer).equals(Buffer.from(second.buffer))).toBe(
      true,
    );
  });
});
