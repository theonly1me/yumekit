import type { IncomingMessage } from "node:http";
import type { z } from "zod";
import type { Outcome } from "../engineTypes.js";
import type { Failure } from "./responses.js";

export const bodyLimitBytes = 10 * 1024 * 1024;

const bodyTooLarge: Failure = {
  status: 413,
  kind: "body-too-large",
  message: `The body is larger than ${String(bodyLimitBytes)} bytes.`,
};

function readBodyText(
  request: IncomingMessage,
): Promise<Outcome<string, Failure>> {
  const finished = Promise.withResolvers<Outcome<string, Failure>>();
  const chunks: Buffer[] = [];
  let size = 0;
  let isTooLarge =
    Number(request.headers["content-length"] ?? "0") > bodyLimitBytes;
  request.on("data", (chunk: Buffer) => {
    if (isTooLarge) return;
    size += chunk.length;
    isTooLarge = size > bodyLimitBytes;
    if (isTooLarge) chunks.length = 0;
    else chunks.push(chunk);
  });
  request.on("end", () => {
    finished.resolve(
      isTooLarge
        ? { ok: false, failure: bodyTooLarge }
        : { ok: true, value: Buffer.concat(chunks).toString() },
    );
  });
  request.on("error", () => {
    finished.resolve({
      ok: false,
      failure: {
        status: 400,
        kind: "body-not-read",
        message: "The body ended early.",
      },
    });
  });
  return finished.promise;
}

function parsedJsonOf(text: string): Outcome<unknown, Failure> {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      failure: {
        status: 400,
        kind: "body-not-valid",
        message: "The body is not valid JSON.",
      },
    };
  }
}

export async function readJsonBody<Value>(options: {
  request: IncomingMessage;
  schema: z.ZodType<Value>;
}): Promise<Outcome<Value, Failure>> {
  const text = await readBodyText(options.request);
  if (!text.ok) return text;
  const json = parsedJsonOf(text.value);
  if (!json.ok) return json;
  const parsed = options.schema.safeParse(json.value);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : {
        ok: false,
        failure: {
          status: 400,
          kind: "body-not-valid",
          message: parsed.error.issues
            .map(
              (issue) => `${issue.path.join(".") || "body"}: ${issue.message}`,
            )
            .join("; "),
        },
      };
}
