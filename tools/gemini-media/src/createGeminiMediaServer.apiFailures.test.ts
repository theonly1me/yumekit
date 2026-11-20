import { readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { maximumPolls } from "./video/requestVideo.ts";
import { callVideo } from "./testing/callVideo.ts";
import {
  inOrder,
  placeholderKey,
  resultText,
} from "./testing/connectGeminiMedia.ts";
import { apiError, inProgressInteraction } from "./testing/fakeInteractions.ts";

describe("generate_video API failures", () => {
  it("returns the status and the message of an API error and writes no file", async () => {
    const { result, outputDirectory } = await callVideo({
      respond: inOrder([
        () =>
          apiError({
            status: 400,
            message: "Setting a duration over 15 seconds is not valid.",
          }),
      ]),
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "The Gemini API answered 400: Setting a duration over 15 seconds is not valid.",
    );
    await expect(readdir(outputDirectory)).rejects.toThrow();
  });

  it("returns a message when the network call fails", async () => {
    const { result } = await callVideo({
      respond: () => Promise.reject(new Error("getaddrinfo ENOTFOUND")),
      arguments: {},
    });

    expect(resultText(result)).toBe(
      "Cannot reach the Gemini API: getaddrinfo ENOTFOUND",
    );
  });

  it("returns the status when the interaction fails while the server polls", async () => {
    const { result } = await callVideo({
      respond: inOrder([
        () => inProgressInteraction("v1_lake"),
        () => Response.json({ id: "v1_lake", status: "failed" }),
      ]),
      arguments: {},
    });

    expect(resultText(result)).toBe(
      "The Gemini API ended the interaction v1_lake with the status failed.",
    );
  });

  it("returns a message when a completed interaction holds no video", async () => {
    const { result } = await callVideo({
      respond: inOrder([
        () =>
          Response.json({
            id: "v1_lake",
            status: "completed",
            steps: [{ type: "model_output", content: [] }],
          }),
      ]),
      arguments: {},
    });

    expect(resultText(result)).toBe(
      "The Gemini API finished the interaction v1_lake with no video.",
    );
  });

  it("stops polling before the tool timeout of the harness", async () => {
    const { result, waits } = await callVideo({
      respond: () => Promise.resolve(inProgressInteraction("v1_lake")),
      arguments: {},
    });

    expect(waits).toHaveLength(maximumPolls);
    expect(new Set(waits)).toEqual(new Set([10]));
    expect(maximumPolls * 10).toBeLessThan(600);
    expect(resultText(result)).toBe(
      "The Gemini API did not finish the interaction v1_lake in 550 seconds.",
    );
  });

  it("never puts the key in a failure message", async () => {
    const { result } = await callVideo({
      respond: inOrder([
        () => apiError({ status: 403, message: "Permission denied" }),
      ]),
      arguments: {},
    });

    expect(resultText(result)).not.toContain(placeholderKey);
  });
});
