import { z } from "zod";
import { errorMessage, type Outcome } from "./toolResults.ts";

export type SendRequest = (request: Request) => Promise<Response>;

export const openAiApiUrl = "https://api.openai.com/v1";

export const missingKeyMessage =
  "OPENAI_API_KEY is not set. Create a key at https://platform.openai.com/api-keys, then run `yumekit keys set OPENAI_API_KEY`. Or set OPENAI_API_KEY in your shell, and list it in passEnvironment of this server in media-tools.json.";

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

async function sendToOpenAi(options: {
  sendRequest: SendRequest;
  request: Request;
}): Promise<Outcome<Response, string>> {
  let response: Response;
  try {
    response = await options.sendRequest(options.request);
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot reach the OpenAI API: ${errorMessage(error)}`,
    };
  }
  if (!response.ok) {
    const message = await failureMessage(response);
    return {
      ok: false,
      failure: `The OpenAI API answered ${String(response.status)}: ${message}`,
    };
  }
  return { ok: true, value: response };
}

export async function requestJson(options: {
  sendRequest: SendRequest;
  request: Request;
}): Promise<Outcome<unknown, string>> {
  const sent = await sendToOpenAi(options);
  if (!sent.ok) return sent;
  try {
    const body: unknown = await sent.value.json();
    return { ok: true, value: body };
  } catch (error) {
    return {
      ok: false,
      failure: `The OpenAI API sent a body that is not JSON: ${errorMessage(error)}`,
    };
  }
}

export async function requestBytes(options: {
  sendRequest: SendRequest;
  request: Request;
}): Promise<Outcome<Buffer, string>> {
  const sent = await sendToOpenAi(options);
  if (!sent.ok) return sent;
  try {
    return { ok: true, value: Buffer.from(await sent.value.arrayBuffer()) };
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot read the audio from the OpenAI API: ${errorMessage(error)}`,
    };
  }
}

export function jsonRequest(options: {
  path: string;
  apiKey: string;
  body: Record<string, unknown>;
}): Request {
  return new Request(`${openAiApiUrl}${options.path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${options.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(options.body),
  });
}

export function formRequest(options: {
  path: string;
  apiKey: string;
  form: FormData;
}): Request {
  return new Request(`${openAiApiUrl}${options.path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${options.apiKey}` },
    body: options.form,
  });
}
