import { describe, expect, it } from "vitest";
import { fixedRequestTextOf, sendFixedRequest } from "./fixedRequests.js";

describe("the fixed requests", () => {
  it("gives the texts of document 15", () => {
    expect(
      fixedRequestTextOf({ kind: "make-this-music", words: "slow strings" }),
    ).toBe("Change the music to: slow strings.");
    expect(
      fixedRequestTextOf({
        kind: "use-my-file",
        fileName: "Morning guitar.wav",
      }),
    ).toBe("Use my file Morning guitar.wav in the video where it fits best.");
    expect(
      fixedRequestTextOf({ kind: "another-voice", voiceName: "cedar" }),
    ).toBe("Record the voice again with the voice cedar.");
    expect(fixedRequestTextOf({ kind: "match-the-captions" })).toBe(
      "Make the captions match my recording.",
    );
    expect(
      fixedRequestTextOf({ kind: "back-to-graphics", aboutClipId: "second" }),
    ).toBe("Draw this scene by code, with no video clip.");
  });

  it("adds the model that the person picked for one request", () => {
    expect(
      fixedRequestTextOf({
        kind: "another-voice",
        voiceName: "cedar",
        model: {
          server: "openai",
          serverLabel: "OpenAI",
          model: "gpt-4o-mini-tts",
          modelLabel: "GPT-4o mini TTS",
        },
      }),
    ).toBe(
      "Record the voice again with the voice cedar. Use the model GPT-4o mini TTS of OpenAI.",
    );
  });

  it("ends the words of the person with a period before the model sentence", () => {
    expect(
      fixedRequestTextOf({
        kind: "change-the-picture",
        words: "a night sky",
        aboutClipId: "opening",
        model: {
          server: "openai",
          serverLabel: "OpenAI",
          model: "gpt-image-1",
          modelLabel: "gpt-image-1",
        },
      }),
    ).toBe(
      "Change the picture of this scene: a night sky. Use the model gpt-image-1 of OpenAI.",
    );
  });

  it("keeps the end mark that the person typed", () => {
    expect(
      fixedRequestTextOf({ kind: "make-this-music", words: "bright drums!" }),
    ).toBe("Change the music to: bright drums!");
  });

  it("sends a request about a scene with its clip", async () => {
    const asked: unknown[] = [];

    await sendFixedRequest({
      ask: (input) => {
        asked.push(input);
        return Promise.resolve(true);
      },
      request: {
        kind: "change-the-picture",
        words: "a red boat",
        aboutClipId: "second",
      },
    });

    expect(asked).toEqual([
      {
        text: "Change the picture of this scene: a red boat.",
        aboutClipId: "second",
      },
    ]);
  });
});
