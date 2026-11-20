import { describe, expect, it } from "vitest";
import {
  connectGeminiMedia,
  inOrder,
  placeholderKey,
} from "./testing/connectGeminiMedia.ts";
import { apiError } from "./testing/fakeInteractions.ts";

async function checkKey(options: {
  environment: NodeJS.ProcessEnv;
  respond: (request: Request) => Promise<Response>;
}) {
  const media = await connectGeminiMedia(options);
  const result = await media.callTool({ name: "check_key", arguments: {} });
  return { result, requests: media.requests };
}

const withKey = { GEMINI_API_KEY: placeholderKey };

describe("check_key", () => {
  it("reads the model facts with the key in a header, which costs nothing", async () => {
    const { result, requests } = await checkKey({
      environment: withKey,
      respond: inOrder([
        () => Response.json({ name: "models/gemini-omni-1.2-flash" }),
      ]),
    });

    const [request] = requests;
    expect(request?.method).toBe("GET");
    expect(request?.url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-omni-1.2-flash",
    );
    expect(request?.headers.get("x-goog-api-key")).toBe(placeholderKey);
    expect(result.structuredContent).toEqual({
      valid: true,
      message:
        "GEMINI_API_KEY works, and the Gemini API knows the model gemini-omni-1.2-flash.",
    });
  });

  it("returns valid false with the message of the API for a rejected key, and no key value", async () => {
    const { result } = await checkKey({
      environment: withKey,
      respond: inOrder([
        () =>
          apiError({
            status: 400,
            message: "API key not valid. Please pass a valid API key.",
          }),
      ]),
    });

    expect(result.structuredContent).toEqual({
      valid: false,
      message:
        "GEMINI_API_KEY does not work. The Gemini API answered 400: API key not valid. Please pass a valid API key.",
    });
    expect(JSON.stringify(result)).not.toContain(placeholderKey);
  });

  it("returns valid false and names GEMINI_API_KEY when the key is missing, with no request", async () => {
    const { result, requests } = await checkKey({
      environment: {},
      respond: inOrder([]),
    });

    expect(requests).toHaveLength(0);
    expect(result.structuredContent).toMatchObject({ valid: false });
    expect(JSON.stringify(result.structuredContent)).toContain(
      "GEMINI_API_KEY is not set",
    );
  });
});
