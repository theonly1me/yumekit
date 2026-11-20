import { describe, expect, it } from "vitest";
import { callVideo } from "./testing/callVideo.ts";
import {
  inOrder,
  placeholderKey,
  resultText,
} from "./testing/connectGeminiMedia.ts";
import {
  completedInteraction,
  sampleVideo,
} from "./testing/fakeInteractions.ts";

const fiveSecondsAt720pTokens = 5 * 5792;

const finishedWithTokens = () =>
  completedInteraction({
    id: "v1_cost",
    video: sampleVideo,
    videoTokens: fiveSecondsAt720pTokens,
  });

describe("generate_video cost", () => {
  it("returns cost_usd as an estimate from the video tokens at 12 US dollars for one million tokens", async () => {
    const { result } = await callVideo({
      respond: inOrder([finishedWithTokens]),
      arguments: {},
    });

    expect(result.structuredContent).toMatchObject({
      cost_usd: 0.34752,
      cost_is_estimate: true,
    });
  });

  it("uses the price in YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS", async () => {
    const { result } = await callVideo({
      respond: inOrder([finishedWithTokens]),
      arguments: {},
      environment: {
        GEMINI_API_KEY: placeholderKey,
        YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS: "10",
      },
    });

    expect(result.structuredContent).toMatchObject({
      cost_usd: 0.2896,
      cost_is_estimate: true,
    });
  });

  it("rejects a price variable that is not a number, before any request", async () => {
    const { result, requests } = await callVideo({
      respond: inOrder([finishedWithTokens]),
      arguments: {},
      environment: {
        GEMINI_API_KEY: placeholderKey,
        YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS: "twelve",
      },
    });

    expect(resultText(result)).toBe(
      'YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS must be a number of US dollars of 0 or more. It is "twelve".',
    );
    expect(requests).toHaveLength(0);
  });

  it("returns no cost_usd when the response reports no video tokens", async () => {
    const { result } = await callVideo({
      respond: inOrder([
        () => completedInteraction({ id: "v1_cost", video: sampleVideo }),
      ]),
      arguments: {},
    });

    expect(result.structuredContent).not.toHaveProperty("cost_usd");
    expect(result.structuredContent).not.toHaveProperty("cost_is_estimate");
  });
});
