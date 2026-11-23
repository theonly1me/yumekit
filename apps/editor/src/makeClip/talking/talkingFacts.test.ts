import { describe, expect, it } from "vitest";
import type { Asset, Scene, Snapshot } from "../../engine/snapshot.js";
import { sceneVoiceOf, speakersOf } from "./talkingFacts.js";

const output = { id: "wide", label: "Wide", widthPixels: 64, heightPixels: 36 };

const sceneClip = {
  id: "second",
  sceneId: "second",
  startFrame: 30,
  durationFrames: 60,
  sceneStartFrame: 0,
};

const voice: Asset = {
  id: "voice",
  kind: "audio",
  hasWords: true,
  durationFrames: 120,
  source: {
    kind: "tool",
    tool: "generate_speech",
    input: { text: "a long line" },
  },
};

const face: Asset = {
  id: "face",
  kind: "image",
  hasWords: false,
  source: { kind: "import", originalName: "Face.png" },
};

function snapshotWith(options: {
  voiceStartFrame: number;
  gainDecibels: number;
}): Snapshot {
  return {
    revision: 1,
    project: { name: "Test", framesPerSecond: 30, outputs: [output] },
    bible: { cast: [] },
    script: "",
    scenes: [],
    sceneCode: {},
    assets: [voice, face],
    timelines: [
      {
        outputId: "wide",
        tracks: [
          { id: "scenes", kind: "scene", clips: [sceneClip] },
          {
            id: "narration",
            kind: "audio",
            clips: [
              {
                id: "narration-voice",
                assetId: "voice",
                startFrame: options.voiceStartFrame,
                durationFrames: 120,
                assetStartFrame: 0,
                gainDecibels: options.gainDecibels,
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("the voice of a scene for a talking clip", () => {
  it("takes the part of a long narration under the scene, from the start of the scene", () => {
    const facts = sceneVoiceOf({
      snapshot: snapshotWith({ voiceStartFrame: 0, gainDecibels: -3 }),
      output,
      clip: sceneClip,
    });

    expect(facts).toMatchObject({
      assetId: "voice",
      words: "",
      startSeconds: 1,
      lengthSeconds: 2,
      leadSeconds: 0,
      gainDecibels: -3,
    });
  });

  it("adds the silence before a voice that starts later than the scene, so the lips stay in time", () => {
    const facts = sceneVoiceOf({
      snapshot: snapshotWith({ voiceStartFrame: 45, gainDecibels: -90 }),
      output,
      clip: sceneClip,
    });

    expect(facts).toMatchObject({
      startSeconds: 0,
      lengthSeconds: 1.5,
      leadSeconds: 0.5,
      gainDecibels: 0,
    });
  });
});

describe("who can talk in a scene", () => {
  it("lists each cast person with a picture first, then the picture of the scene", () => {
    const snapshot = snapshotWith({ voiceStartFrame: 0, gainDecibels: 0 });
    const scene: Scene = {
      id: "second",
      title: "Second",
      notes: "",
      source: {
        kind: "kit",
        component: "image-pan",
        props: { imageAssetId: "face", caption: "voice" },
      },
    };

    const speakers = speakersOf({
      snapshot: {
        ...snapshot,
        bible: {
          cast: [
            {
              id: "mia",
              kind: "person",
              name: "Mia",
              description: "",
              referenceAssetIds: ["face"],
            },
            {
              id: "cup",
              kind: "product",
              name: "Cup",
              description: "",
              referenceAssetIds: ["face"],
            },
            {
              id: "leo",
              kind: "person",
              name: "Leo",
              description: "",
              referenceAssetIds: [],
            },
          ],
        },
      },
      scene,
    });

    expect(speakers.map((speaker) => speaker.name)).toEqual([
      "Mia",
      "The picture of this scene",
    ]);
  });
});
