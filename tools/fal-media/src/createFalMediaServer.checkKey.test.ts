import { describe, expect, it } from "vitest";
import {
  connectFalMedia,
  placeholderKey,
  resultText,
} from "./testing/connectFalMedia.ts";
import { fakeFal } from "./testing/fakeFal.ts";

async function checkKey(options: {
  environment: NodeJS.ProcessEnv;
  answer?: (request: Request) => Promise<Response> | undefined;
}) {
  const media = await connectFalMedia({
    environment: options.environment,
    respond: fakeFal(
      options.answer === undefined ? {} : { answer: options.answer },
    ),
  });
  const result = await media.callTool({ name: "check_key", arguments: {} });
  return { result, requests: media.requests };
}

const withKey = { FAL_KEY: placeholderKey };

describe("check_key", () => {
  it("returns valid for a key that fal accepts, with one request to the price list", async () => {
    const { result, requests } = await checkKey({ environment: withKey });

    expect(result.structuredContent).toEqual({
      valid: true,
      message: "fal accepted the key in FAL_KEY.",
    });
    expect(requests.map((request) => request.url)).toEqual([
      "https://api.fal.ai/v1/models/pricing?endpoint_id=bytedance%2Fseedance-2.5%2Fus%2Ftext-to-video",
    ]);
    expect(requests[0]?.headers.get("authorization")).toBe(
      `Key ${placeholderKey}`,
    );
  });

  it("returns valid false with a clear message for a key that fal rejects", async () => {
    const { result } = await checkKey({
      environment: withKey,
      answer: () =>
        Promise.resolve(
          Response.json(
            {
              error: {
                type: "authorization_error",
                message: "Invalid API key",
              },
            },
            { status: 401 },
          ),
        ),
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      valid: false,
      message:
        "fal rejected the key in FAL_KEY. Create a new key at the keys page of the fal dashboard and set FAL_KEY again. fal answered 401: Invalid API key",
    });
  });

  it("returns valid false and names FAL_KEY with no request when the key is missing", async () => {
    const { result, requests } = await checkKey({ environment: {} });

    expect(result.structuredContent).toMatchObject({ valid: false });
    expect(resultText(result)).toContain("FAL_KEY is not set");
    expect(requests).toHaveLength(0);
  });

  it("returns a failure, not an answer about the key, when fal has a server error", async () => {
    const { result } = await checkKey({
      environment: withKey,
      answer: () =>
        Promise.resolve(new Response("Bad gateway", { status: 502 })),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "Cannot check FAL_KEY. fal answered 502: Bad gateway",
    );
  });
});
