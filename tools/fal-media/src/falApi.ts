import { z } from "zod";
import { errorMessage, type Outcome } from "./toolResults.ts";

export type SendRequest = (request: Request) => Promise<Response>;

export const falUrls = {
  queue: "https://queue.fal.run",
  uploadInitiate:
    "https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3",
  platform: "https://api.fal.ai/v1",
} as const;

export const queueHostNames = ["queue.fal.run", "queue.falrun.com"] as const;

export const getKeyUrl = "https://fal.ai/dashboard/keys";

export const missingKeyMessage = `FAL_KEY is not set. Create a key at ${getKeyUrl}, set FAL_KEY in your shell, and list it in passEnvironment of this server in media-tools.json.`;

const detailText = z.object({ detail: z.string() });
const detailList = z.object({
  detail: z.array(
    z.object({ loc: z.array(z.unknown()).optional(), msg: z.string() }),
  ),
});
const platformError = z.object({ error: z.object({ message: z.string() }) });

function bodyMessage(body: unknown): string | undefined {
  const text = detailText.safeParse(body);
  if (text.success) return text.data.detail;
  const list = detailList.safeParse(body);
  if (list.success) {
    return list.data.detail
      .map((entry) =>
        entry.loc === undefined
          ? entry.msg
          : `${entry.loc.map(String).join(".")}: ${entry.msg}`,
      )
      .join("; ");
  }
  const platform = platformError.safeParse(body);
  return platform.success ? platform.data.error.message : undefined;
}

function parsedMessage(text: string): string | undefined {
  try {
    return bodyMessage(JSON.parse(text));
  } catch {
    return undefined;
  }
}

export interface FalFailure {
  status?: number;
  message: string;
}

export function authorization(apiKey: string): { authorization: string } {
  return { authorization: `Key ${apiKey}` };
}

export async function sendToFal(options: {
  sendRequest: SendRequest;
  request: Request;
}): Promise<Outcome<Response, FalFailure>> {
  let response: Response;
  try {
    response = await options.sendRequest(options.request);
  } catch (error) {
    return {
      ok: false,
      failure: { message: `Cannot reach fal: ${errorMessage(error)}` },
    };
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const detail = parsedMessage(text) ?? (text || response.statusText);
    return {
      ok: false,
      failure: {
        status: response.status,
        message: `fal answered ${String(response.status)}: ${detail}`,
      },
    };
  }
  return { ok: true, value: response };
}

export async function requestJson<Body>(options: {
  sendRequest: SendRequest;
  request: Request;
  schema: z.ZodType<Body>;
}): Promise<Outcome<Body, FalFailure>> {
  const sent = await sendToFal(options);
  if (!sent.ok) return sent;
  let body: unknown;
  try {
    body = await sent.value.json();
  } catch (error) {
    return {
      ok: false,
      failure: {
        message: `fal sent a body that is not JSON: ${errorMessage(error)}`,
      },
    };
  }
  const parsed = options.schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      failure: {
        message: `fal sent a body of an unknown shape: ${parsed.error.message}`,
      },
    };
  }
  return { ok: true, value: parsed.data };
}

export async function requestBytes(options: {
  sendRequest: SendRequest;
  request: Request;
}): Promise<Outcome<Buffer, FalFailure>> {
  const sent = await sendToFal(options);
  if (!sent.ok) return sent;
  try {
    return { ok: true, value: Buffer.from(await sent.value.arrayBuffer()) };
  } catch (error) {
    return {
      ok: false,
      failure: {
        message: `Cannot read the file from fal: ${errorMessage(error)}`,
      },
    };
  }
}
