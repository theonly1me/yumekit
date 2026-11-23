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

  it("gives the text of Let the AI write it of document 16, with the model of the sheet", () => {
    expect(
      fixedRequestTextOf({
        kind: "let-the-ai-make-the-clip",
        aboutClipId: "second",
        model: {
          server: "sample",
          serverLabel: "Sample",
          model: "sample-video",
          modelLabel: "Plain color",
        },
      }),
    ).toBe(
      "Make a real video clip for this scene. Write the prompt and pick the camera move yourself. Use the model Plain color of Sample.",
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
