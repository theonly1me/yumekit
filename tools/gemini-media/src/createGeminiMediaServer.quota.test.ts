import { describe, expect, it } from "vitest";
import { callVideo } from "./testing/callVideo.ts";
import {
  inOrder,
  placeholderKey,
  resultText,
} from "./testing/connectGeminiMedia.ts";
import { inProgressInteraction } from "./testing/fakeInteractions.ts";

const quotaMessage =
  "You exceeded your current quota for this model. Try again later.";

describe("generate_video when the service quota is used up", () => {
  it("passes on the code and the message of a failed interaction and marks it as a service quota", async () => {
    const { result } = await callVideo({
      respond: inOrder([
        () => inProgressInteraction("v1_lake"),
        () =>
          Response.json({
            id: "v1_lake",
            status: "failed",
            errors: [{ message: quotaMessage, code: "RESOURCE_EXHAUSTED" }],
          }),
      ]),
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      `The Gemini API ended the interaction v1_lake with the status failed: RESOURCE_EXHAUSTED: ${quotaMessage}`,
    );
    expect(result._meta).toEqual({ "yumekit/failure": "service-quota" });
    expect(resultText(result)).not.toContain(placeholderKey);
  });

  it("marks an API answer with the status RESOURCE_EXHAUSTED as a service quota", async () => {
    const { result } = await callVideo({
      respond: inOrder([
        () =>
          Response.json(
            {
              error: {
                code: 429,
                message: quotaMessage,
                status: "RESOURCE_EXHAUSTED",
              },
            },
            { status: 429 },
          ),
      ]),
      arguments: {},
    });

    expect(resultText(result)).toBe(
      `The Gemini API answered 429: RESOURCE_EXHAUSTED: ${quotaMessage}`,
    );
    expect(result._meta).toEqual({ "yumekit/failure": "service-quota" });
  });

  it("keeps a failed interaction with no errors as before, with no quota mark", async () => {
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
    expect(result._meta).toBeUndefined();
  });
});
