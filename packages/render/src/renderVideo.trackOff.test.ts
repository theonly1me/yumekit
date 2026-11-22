import { join } from "node:path";
import type { Edit } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { renderFrame, renderVideo } from "./index.js";
import { decodePng } from "./testing/decodePng.js";
import { openPreview } from "./testing/openPreview.js";
import {
  decodeAudio,
  loudness,
  meanColorOfFirstPicture,
} from "./testing/probe.js";
import {
  createRenderProject,
  moduleScene,
  temporaryFolder,
} from "./testing/renderProject.js";
import { solidColorCode } from "./testing/sceneCodes.js";
import { addToneAsset } from "./testing/toneWav.js";
import { valueOf } from "./testing/valueOf.js";

const red = [255, 0, 0];

function toneClip(options: { id: string; startFrame: number }) {
  return {
    id: options.id,
    assetId: "tone",
    startFrame: options.startFrame,
    durationFrames: 30,
    assetStartFrame: 0,
    gainDecibels: 0,
  };
}

function timelineWithOffTracks(): Edit {
  const fullClip = { startFrame: 0, durationFrames: 60, sceneStartFrame: 0 };
  return {
    kind: "setTimeline",
    timeline: {
      outputId: "wide",
      tracks: [
        {
          id: "back",
          kind: "scene",
          clips: [{ id: "red", sceneId: "red", ...fullClip }],
        },
        {
          id: "front",
          kind: "scene",
          off: true,
          clips: [{ id: "blue", sceneId: "blue", ...fullClip }],
        },
        {
          id: "voice",
          kind: "audio",
          clips: [toneClip({ id: "early", startFrame: 0 })],
        },
        {
          id: "music",
          kind: "audio",
          off: true,
          clips: [toneClip({ id: "late", startFrame: 30 })],
        },
      ],
    },
  };
}

function projectWithOffTracks(): Promise<string> {
  return createRenderProject({
    edits: async (store) => [
      moduleScene({
        sceneId: "red",
        code: solidColorCode,
        props: { color: "#ff0000" },
      }),
      moduleScene({
        sceneId: "blue",
        code: solidColorCode,
        props: { color: "#0000ff" },
      }),
      await addToneAsset({
        folder: store.folder,
        assetId: "tone",
        durationFrames: 30,
      }),
      timelineWithOffTracks(),
    ],
  });
}

describe("a track that is off", () => {
  it("is absent from the pictures and the sound of the rendered file, which keeps its full length", async () => {
    const folder = await projectWithOffTracks();
    const destination = join(await temporaryFolder(), "off.mp4");

    const rendered = valueOf(
      await renderVideo({ folder, outputId: "wide", destination, scale: 0.5 }),
    );
    const frame = valueOf(
      await renderFrame({ folder, outputId: "wide", frame: 10 }),
    );
    const samples = await decodeAudio(destination);

    expect(rendered.frameCount).toBe(60);
    expect((await decodePng(frame.png)).pixelAt({ x: 160, y: 90 })).toEqual(
      red,
    );
    const [meanRed = 0, meanGreen = 0, meanBlue = 0] =
      await meanColorOfFirstPicture(destination);
    expect(meanRed).toBeGreaterThan(200);
    expect(Math.max(meanGreen, meanBlue)).toBeLessThan(40);
    expect(
      loudness({ samples, fromSeconds: 0.1, toSeconds: 0.9 }),
    ).toBeGreaterThan(2000);
    expect(
      loudness({ samples, fromSeconds: 1.1, toSeconds: 1.9 }),
    ).toBeLessThan(50);
  });

  it("is absent from the preview page", async () => {
    const folder = await projectWithOffTracks();
    const preview = await openPreview({ folder });
    try {
      await preview.parent.waitForReply((reply) => reply.type === "ready");
      await preview.seek({ frame: 10, requestId: 1 });
      const shown = await decodePng(await preview.parent.screenshot());

      expect(shown.pixelAt({ x: 160, y: 90 })).toEqual(red);
    } finally {
      await preview.close();
    }
  });
});
