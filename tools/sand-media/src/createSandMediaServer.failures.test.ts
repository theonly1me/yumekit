import { readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { callVideo } from "./testing/callVideo.ts";
import { placeholderKey, resultText } from "./testing/connectSandMedia.ts";
import { arkError, fakeSand, taskAnswer } from "./testing/fakeSand.ts";
import { maximumPolls } from "./video/runTask.ts";

describe("generate_video failures of Sand AI", () => {
  it("says in plain words that Sand AI refused the prompt, and writes no file", async () => {
    const { result, outputDirectory } = await callVideo({
      respond: fakeSand({
        created: () =>
          arkError({
            status: 400,
            code: "InputSensitiveContentDetected",
            message: "The input may contain sensitive content.",
          }),
      }),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "Sand AI refused the prompt or a picture. Change the words or the picture, and try again. Sand AI answered 400: InputSensitiveContentDetected: The input may contain sensitive content.",
    );
    expect(result._meta).toBeUndefined();
    await expect(readdir(outputDirectory)).rejects.toThrow();
  });

  it("says that the account has too few credits, with the page of the balance", async () => {
    const { result } = await callVideo({
      respond: fakeSand({
        created: () =>
          arkError({
            status: 400,
            code: "InsufficientBalance",
            message: "Insufficient balance.",
          }),
      }),
    });

    expect(resultText(result)).toBe(
      "The Sand AI account has too few credits for this clip. See the balance at https://platform.sand.ai/app/general/, or pick another service in Settings. Sand AI answered 400: InsufficientBalance: Insufficient balance.",
    );
  });

  it("marks a rate limit as a service quota, so yumekit sends no more calls of the group", async () => {
    const { result } = await callVideo({
      respond: fakeSand({
        created: () =>
          arkError({
            status: 429,
            code: "RateLimitExceeded",
            message: "Too many requests.",
          }),
      }),
    });

    expect(resultText(result)).toBe(
      "Sand AI got too many requests from this account. Wait a minute, or pick another service in Settings. Sand AI answered 429: RateLimitExceeded: Too many requests.",
    );
    expect(result._meta).toEqual({ "yumekit/failure": "service-quota" });
  });

  it("names the status and the reason of a task that ends with no clip", async () => {
    const { result } = await callVideo({
      respond: fakeSand({
        polls: [
          () =>
            taskAnswer({
              status: "failed",
              error: {
                code: "content_policy_violation",
                message: "Output did not pass moderation.",
              },
            }),
        ],
      }),
    });

    expect(resultText(result)).toBe(
      "Sand AI refused the prompt or a picture. Change the words or the picture, and try again. Sand AI ended the task 987654321 with the status failed: content_policy_violation: Output did not pass moderation.",
    );
  });

  it("keeps reading after a read that fails with 503, because the task still runs", async () => {
    const { result } = await callVideo({
      respond: fakeSand({
        polls: [
          () =>
            arkError({
              status: 503,
              code: "ServiceUnavailable",
              message: "Try again.",
            }),
          () => taskAnswer({ status: "running" }),
        ],
      }),
    });

    expect(result.isError).toBeFalsy();
  });

  it("stops reading before the tool time limit, and says that Sand AI can still charge for the clip", async () => {
    const { result, waits } = await callVideo({
      respond: fakeSand({
        polls: Array.from(
          { length: maximumPolls },
          () => () => taskAnswer({ status: "running" }),
        ),
      }),
    });

    expect(waits).toHaveLength(maximumPolls);
    expect(maximumPolls * 10).toBeLessThan(600);
    expect(resultText(result)).toBe(
      "Sand AI did not finish the task 987654321 in 550 seconds. Sand AI can still finish the clip and charge for it.",
    );
  });

  it("says that Sand AI cannot be reached when the network call fails", async () => {
    const { result } = await callVideo({
      respond: () => Promise.reject(new Error("getaddrinfo ENOTFOUND")),
    });

    expect(resultText(result)).toBe(
      "Cannot reach Sand AI: getaddrinfo ENOTFOUND",
    );
  });

  it("never puts the key in a failure message", async () => {
    const { result } = await callVideo({
      respond: fakeSand({
        created: () =>
          arkError({
            status: 401,
            code: "AuthenticationError",
            message: `The key ${placeholderKey} is not valid.`,
          }),
      }),
    });

    expect(resultText(result)).toBe(
      "Sand AI answered 401: AuthenticationError: The key [SAND_API_KEY] is not valid.",
    );
  });
});
