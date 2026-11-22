import { describe, expect, it } from "vitest";
import { fixedRequestTextOf, sendFixedRequest } from "./fixedRequests.js";

describe("the fixed requests", () => {
  it("gives the texts of document 15", () => {
    expect(
      fixedRequestTextOf({ kind: "make-this-music", words: "slow strings" }),
    ).toBe("Change the music to: slow strings");
    expect(
      fixedRequestTextOf({ kind: "another-voice", voiceName: "cedar" }),
    ).toBe("Record the voice again with the voice cedar.");
    expect(fixedRequestTextOf({ kind: "match-the-captions" })).toBe(
      "Make the captions match my recording.",
    );
    expect(
      fixedRequestTextOf({ kind: "back-to-graphics", aboutClipId: "second" }),
    ).toBe("Draw this scene by code, with no video clip.");
    expect(
      fixedRequestTextOf({
        kind: "make-a-cast-picture",
        name: "Mia",
        description: "Short black hair",
      }),
    ).toBe(
      'Make a picture of "Mia" from the cast. It looks like this: Short black hair. Add the picture to the pictures of that cast entry.',
    );
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

  it("adds the model that the person picked for one new picture", () => {
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
      "Change the picture of this scene: a night sky Use the model gpt-image-1 of OpenAI.",
    );
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
        text: "Change the picture of this scene: a red boat",
        aboutClipId: "second",
      },
    ]);
  });
});
