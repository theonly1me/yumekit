import { describe, expect, it } from "vitest";
import {
  connectSandMedia,
  placeholderKey,
  resultText,
} from "./testing/connectSandMedia.ts";

async function checkKey(options: {
  environment?: NodeJS.ProcessEnv;
  answer: () => Response;
}) {
  const media = await connectSandMedia({
    environment: options.environment ?? { SAND_API_KEY: placeholderKey },
    respond: () => Promise.resolve(options.answer()),
  });
  const result = await media.callTool({ name: "check_key", arguments: {} });
  return { result, requests: media.requests };
}

describe("check_key", () => {
  it("reads a generation that is not there, and counts a 404 generation_not_found as a working key", async () => {
    const { result, requests } = await checkKey({
      answer: () =>
        Response.json(
          { code: "generation_not_found", message: "Generation not found." },
          { status: 404 },
        ),
    });

    expect(result.structuredContent).toEqual({
      valid: true,
      message: "Sand AI accepted the key in SAND_API_KEY.",
    });
    const [request] = requests;
    expect(request?.method).toBe("GET");
    expect(request?.url).toBe("https://api.sand.ai/v2/generations/1");
    expect(request?.headers.get("authorization")).toBe(
      `Bearer ${placeholderKey}`,
    );
  });

  it("says that Sand AI rejected a key that answers 401, and where to make a new one", async () => {
    const { result } = await checkKey({
      answer: () =>
        Response.json(
          { code: "invalid_api_key", message: "Missing or invalid API key." },
          { status: 401 },
        ),
    });

    expect(result.structuredContent).toEqual({
      valid: false,
      message:
        "Sand AI rejected the key in SAND_API_KEY. Create a new key at https://platform.sand.ai/app/keys/ and save it again. Sand AI answered 401: invalid_api_key: Missing or invalid API key.",
    });
  });

  it("says that the key is missing with no request", async () => {
    const { result, requests } = await checkKey({
      environment: {},
      answer: () => Response.json({}),
    });

    expect(result.structuredContent).toMatchObject({ valid: false });
    expect(requests).toHaveLength(0);
  });

  it("returns a failure for another answer, because it proves nothing about the key", async () => {
    const { result } = await checkKey({
      answer: () =>
        Response.json(
          { code: "service_unavailable", message: "Try again later." },
          { status: 503 },
        ),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "Cannot check SAND_API_KEY. Sand AI answered 503: service_unavailable: Try again later.",
    );
  });
});
