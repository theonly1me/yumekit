import { z } from "zod";
import { errorMessage, type Outcome } from "./toolResults.ts";

export type SendRequest = (request: Request) => Promise<Response>;

export const openAiApiUrl = "https://api.openai.com/v1";

export const missingKeyMessage =
  "OPENAI_API_KEY is not set. Create a key at https://platform.openai.com/api-keys, set OPENAI_API_KEY in your shell, and list it in passEnvironment of this server in media-tools.json.";

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

export async function sendToOpenAi(options: {
  sendRequest: SendRequest;
  request: Request;
}): Promise<Outcome<unknown, string>> {
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
  try {
    const body: unknown = await response.json();
    return { ok: true, value: body };
  } catch (error) {
    return {
      ok: false,
      failure: `The OpenAI API sent a body that is not JSON: ${errorMessage(error)}`,
    };
  }
}
