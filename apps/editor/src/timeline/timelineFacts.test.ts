import { describe, expect, it } from "vitest";
import type { AudioClip } from "../engine/snapshot.js";
import { audibleClipsOf } from "./timelineFacts.js";

function toneClip(id: string): AudioClip {
  return {
    id,
    assetId: "tone",
    startFrame: 0,
    durationFrames: 30,
    assetStartFrame: 0,
    gainDecibels: 0,
  };
}

describe("the sound of the editor preview", () => {
  it("plays the clips of each audio track that is not off", () => {
    const voice = toneClip("voice");

    const clips = audibleClipsOf({
      outputId: "wide",
      tracks: [
        { id: "voice", kind: "audio", clips: [voice] },
        { id: "music", kind: "audio", off: true, clips: [toneClip("music")] },
      ],
    });

    expect(clips).toEqual([voice]);
  });
});
