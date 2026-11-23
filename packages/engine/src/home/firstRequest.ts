import {
  planFirstSentence,
  platformOf,
  startFormatOf,
  type PlatformId,
  type StartFormatId,
} from "@yumekit/project";
import { z } from "zod";
import type { Outcome } from "../engineTypes.js";
import type { EngineAddress, ProjectLength } from "./homeTypes.js";

export interface FirstRequestFailure {
  kind: string;
  message: string;
}

const failureSchema = z.object({ kind: z.string(), message: z.string() });

const requestWaitMilliseconds = 30_000;

const betweenScenesLine = "Between scenes: a fade from each scene to the next.";

function lengthLineOf(length: ProjectLength): string {
  return length === "auto"
    ? "Length: choose the length that fits the request."
    : `Length: ${String(length)} seconds.`;
}

function formatLinesOf(formatId: StartFormatId): string[] {
  const format = startFormatOf(formatId);
  return format.direction === ""
    ? []
    : [`Format: ${format.name}. ${format.direction}`];
}

export function firstRequestTextOf(options: {
  request: string;
  platformIds: PlatformId[];
  length: ProjectLength;
  formatId: StartFormatId;
  planFirst: boolean;
}): string {
  const names = options.platformIds.map((id) => platformOf(id).name);
  return [
    options.request.trim(),
    `Platforms: ${names.join(", ")}.`,
    ...formatLinesOf(options.formatId),
    lengthLineOf(options.length),
    betweenScenesLine,
    ...(options.planFirst ? [planFirstSentence] : []),
  ].join("\n");
}

async function failureOf(response: Response): Promise<FirstRequestFailure> {
  const body: unknown = await response.json().catch(() => undefined);
  const parsed = failureSchema.safeParse(body);
  return parsed.success
    ? parsed.data
    : {
        kind: "request-not-started",
        message: `The project answered with status ${String(response.status)}.`,
      };
}

export async function sendFirstRequest(options: {
  engine: EngineAddress;
  text: string;
}): Promise<Outcome<{ started: true }, FirstRequestFailure>> {
  try {
    const response = await fetch(`${options.engine.origin}/api/chat/requests`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${options.engine.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ text: options.text }),
      signal: AbortSignal.timeout(requestWaitMilliseconds),
    });
    if (response.status !== 202) {
      return { ok: false, failure: await failureOf(response) };
    }
    await response.text();
    return { ok: true, value: { started: true } };
  } catch {
    return {
      ok: false,
      failure: {
        kind: "request-not-started",
        message: "The project did not answer the first request.",
      },
    };
  }
}
