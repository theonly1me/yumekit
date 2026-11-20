import { z } from "zod";
import { errorMessage, type Outcome } from "./toolResults.ts";

export type SendRequest = (request: Request) => Promise<Response>;

export const geminiApiUrl = "https://generativelanguage.googleapis.com/v1beta";

export const apiRevision = "2026-05-20";

export const missingKeyMessage =
  "GEMINI_API_KEY is not set. Create a key at https://aistudio.google.com/apikey, set GEMINI_API_KEY in your shell, and list it in passEnvironment of this server in media-tools.json.";

const apiErrorBody = z.object({
  error: z.object({ message: z.string() }),
});

function apiErrorMessage(text: string): string | undefined {
  try {
    const body = apiErrorBody.safeParse(JSON.parse(text));
    return body.success ? body.data.error.message : undefined;
  } catch {
    return undefined;
  }
}

async function failureMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  return apiErrorMessage(text) ?? (text || response.statusText);
}

export async function sendToGemini(options: {
  sendRequest: SendRequest;
  request: Request;
}): Promise<Outcome<Response, string>> {
  let response: Response;
  try {
    response = await options.sendRequest(options.request);
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot reach the Gemini API: ${errorMessage(error)}`,
    };
  }
  if (!response.ok) {
    const message = await failureMessage(response);
    return {
      ok: false,
      failure: `The Gemini API answered ${String(response.status)}: ${message}`,
    };
  }
  return { ok: true, value: response };
}

export async function requestJson(options: {
  sendRequest: SendRequest;
  request: Request;
}): Promise<Outcome<unknown, string>> {
  const sent = await sendToGemini(options);
  if (!sent.ok) return sent;
  try {
    const body: unknown = await sent.value.json();
    return { ok: true, value: body };
  } catch (error) {
    return {
      ok: false,
      failure: `The Gemini API sent a body that is not JSON: ${errorMessage(error)}`,
    };
  }
}

export async function requestBytes(options: {
  sendRequest: SendRequest;
  request: Request;
}): Promise<Outcome<Buffer, string>> {
  const sent = await sendToGemini(options);
  if (!sent.ok) return sent;
  try {
    return { ok: true, value: Buffer.from(await sent.value.arrayBuffer()) };
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot read the video from the Gemini API: ${errorMessage(error)}`,
    };
  }
}

export function geminiRequest(options: {
  url: string;
  apiKey: string;
  body?: Record<string, unknown>;
}): Request {
  const headers = {
    "x-goog-api-key": options.apiKey,
    "api-revision": apiRevision,
  };
  if (options.body === undefined) {
    return new Request(options.url, { method: "GET", headers });
  }
  return new Request(options.url, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify(options.body),
  });
}
