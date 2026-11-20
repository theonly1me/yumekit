import { describe, expect, it } from "vitest";
import {
  connectOpenAiMedia,
  errorResponse,
  placeholderKey,
} from "../testing/connectOpenAiMedia.ts";

async function checkKey(options: {
  environment: NodeJS.ProcessEnv;
  respond: (request: Request) => Promise<Response>;
}) {
  const media = await connectOpenAiMedia(options);
  const result = await media.callTool({ name: "check_key", arguments: {} });
  return { result, requests: media.requests };
}

describe("check_key", () => {
  it("lists the models with the key, which is a free request, and returns valid", async () => {
    const { result, requests } = await checkKey({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: () => Promise.resolve(Response.json({ data: [] })),
    });

    const [request] = requests;
    expect(request?.method).toBe("GET");
    expect(request?.url).toBe("https://api.openai.com/v1/models");
    expect(request?.headers.get("authorization")).toBe(
      `Bearer ${placeholderKey}`,
    );
    expect(result.structuredContent).toEqual({
      valid: true,
      message: "The OpenAI API accepted the key.",
    });
  });

  it("returns valid false with a clear message for a rejected key", async () => {
    const { result } = await checkKey({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: () =>
        errorResponse({ status: 401, message: "Incorrect API key provided" }),
    });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toEqual({
      valid: false,
      message:
        "The OpenAI API rejected the key (status 401). Make a new key at https://platform.openai.com/api-keys.",
    });
  });

  it("returns valid false and sends no request when the key is missing", async () => {
    const { result, requests } = await checkKey({
      environment: {},
      respond: () => Promise.resolve(Response.json({ data: [] })),
    });

    expect(result.structuredContent).toEqual({
      valid: false,
      message: "OPENAI_API_KEY is not set.",
    });
    expect(requests).toHaveLength(0);
  });

  it("returns a failure, not a verdict, when the API answers with a server error", async () => {
    const { result } = await checkKey({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: () => errorResponse({ status: 500, message: "Server error" }),
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toBeUndefined();
  });
});
