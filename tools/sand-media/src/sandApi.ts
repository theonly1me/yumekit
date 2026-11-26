import { z } from "zod";
import { errorMessage, type Outcome } from "./toolResults.ts";

export type SendRequest = (request: Request) => Promise<Response>;

export const sandUrls = {
  tasks: "https://api.sand.ai/compatible/ark/api/v3/contents/generations/tasks",
  generations: "https://api.sand.ai/v2/generations",
  keys: "https://platform.sand.ai/app/keys/",
  balance: "https://platform.sand.ai/app/general/",
} as const;

export const keyVariable = "SAND_API_KEY";

export const missingKeyMessage = `${keyVariable} is not set. Create a key at ${sandUrls.keys}, then add it in the editor under Tools or run yumekit keys set ${keyVariable}.`;

export type SandFailureKind = "refused" | "no-credits" | "rate-limit" | "other";

export interface SandFailure {
  kind: SandFailureKind;
  message: string;
  status?: number;
  code?: string;
  canRetry: boolean;
}

const arkError = z.object({
  error: z.object({ code: z.string().optional(), message: z.string() }),
});
const nativeError = z.object({ code: z.string(), message: z.string() });
const statusesWorthAnotherRead = [429, 500, 503];

export function failureKindOf(code: string | undefined): SandFailureKind {
  if (code === undefined) return "other";
  if (/SensitiveContent|content_policy/i.test(code)) return "refused";
  if (/InsufficientBalance|insufficient_credits/i.test(code)) {
    return "no-credits";
  }
  if (/RateLimit|rate_limit/i.test(code)) return "rate-limit";
  return "other";
}

function codeAndMessageOf(text: string): {
  code?: string | undefined;
  message: string;
} {
  try {
    const body: unknown = JSON.parse(text);
    const ark = arkError.safeParse(body);
    if (ark.success) return ark.data.error;
    const native = nativeError.safeParse(body);
    if (native.success) return native.data;
  } catch {
    return { message: text };
  }
  return { message: text };
}

async function answerFailure(response: Response): Promise<SandFailure> {
  const text = await response.text().catch(() => "");
  const { code, message } = codeAndMessageOf(text || response.statusText);
  const status = response.status;
  return {
    kind: failureKindOf(code),
    message: `Sand AI answered ${String(status)}: ${code === undefined ? "" : `${code}: `}${message}`,
    status,
    ...(code === undefined ? {} : { code }),
    canRetry: statusesWorthAnotherRead.includes(status),
  };
}

export async function sendToSand(options: {
  sendRequest: SendRequest;
  request: Request;
}): Promise<Outcome<Response, SandFailure>> {
  let response: Response;
  try {
    response = await options.sendRequest(options.request);
  } catch (error) {
    return {
      ok: false,
      failure: {
        kind: "other",
        message: `Cannot reach Sand AI: ${errorMessage(error)}`,
        canRetry: true,
      },
    };
  }
  if (!response.ok)
    return { ok: false, failure: await answerFailure(response) };
  return { ok: true, value: response };
}

export async function requestJson<Schema extends z.ZodType>(options: {
  sendRequest: SendRequest;
  request: Request;
  schema: Schema;
}): Promise<Outcome<z.infer<Schema>, SandFailure>> {
  const sent = await sendToSand(options);
  if (!sent.ok) return sent;
  const parsed = options.schema.safeParse(
    await sent.value.json().catch(() => undefined),
  );
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    failure: {
      kind: "other",
      message: `Sand AI sent an answer that yumekit cannot read: ${parsed.error.message}`,
      canRetry: false,
    },
  };
}

export function sandRequest(options: {
  url: string;
  apiKey: string;
  body?: string;
}): Request {
  const authorization = `Bearer ${options.apiKey}`;
  if (options.body === undefined) {
    return new Request(options.url, { headers: { authorization } });
  }
  return new Request(options.url, {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: options.body,
  });
}

export function plainFailureText(failure: SandFailure): string {
  switch (failure.kind) {
    case "refused":
      return `Sand AI refused the prompt or a picture. Change the words or the picture, and try again. ${failure.message}`;
    case "no-credits":
      return `The Sand AI account has too few credits for this clip. See the balance at ${sandUrls.balance}, or pick another service in Settings. ${failure.message}`;
    case "rate-limit":
      return `Sand AI got too many requests from this account. Wait a minute, or pick another service in Settings. ${failure.message}`;
    case "other":
      return failure.message;
  }
}

export function withoutKey(options: {
  message: string;
  apiKey: string;
}): string {
  return options.message.replaceAll(options.apiKey, `[${keyVariable}]`);
}
