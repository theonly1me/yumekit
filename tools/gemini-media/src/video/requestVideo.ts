import {
  geminiApiUrl,
  geminiRequest,
  requestBytes,
  requestJson,
  type SendRequest,
} from "../geminiApi.ts";
import type { Outcome } from "../toolResults.ts";
import {
  interactionSchema,
  videoOutputOf,
  videoTokensOf,
  type Interaction,
  type VideoOutput,
} from "./interaction.ts";

export const pollIntervalSeconds = 10;

export const maximumPolls = 55;

export type Wait = (seconds: number) => Promise<void>;

export interface VideoConnection {
  sendRequest: SendRequest;
  apiKey: string;
  wait: Wait;
  reportProgress: (poll: number) => Promise<void>;
}

export interface FinishedVideo {
  bytes: Buffer;
  mimeType: string;
  videoTokens: number | undefined;
}

async function readInteraction(options: {
  connection: VideoConnection;
  request: Request;
}): Promise<Outcome<Interaction, string>> {
  const sent = await requestJson({
    sendRequest: options.connection.sendRequest,
    request: options.request,
  });
  if (!sent.ok) return sent;
  const interaction = interactionSchema.safeParse(sent.value);
  if (!interaction.success) {
    return {
      ok: false,
      failure: `The Gemini API sent an interaction that yumekit cannot read: ${interaction.error.message}`,
    };
  }
  return { ok: true, value: interaction.data };
}

async function waitUntilDone(options: {
  connection: VideoConnection;
  created: Interaction;
}): Promise<Outcome<Interaction, string>> {
  const { connection } = options;
  let interaction = options.created;
  for (let poll = 1; interaction.status === "in_progress"; poll += 1) {
    if (poll > maximumPolls) {
      return {
        ok: false,
        failure: `The Gemini API did not finish the interaction ${interaction.id} in ${String(maximumPolls * pollIntervalSeconds)} seconds.`,
      };
    }
    await connection.wait(pollIntervalSeconds);
    await connection.reportProgress(poll);
    const read = await readInteraction({
      connection,
      request: geminiRequest({
        url: `${geminiApiUrl}/interactions/${encodeURIComponent(interaction.id)}`,
        apiKey: connection.apiKey,
      }),
    });
    if (!read.ok) return read;
    interaction = read.value;
  }
  if (interaction.status !== "completed") {
    return {
      ok: false,
      failure: `The Gemini API ended the interaction ${interaction.id} with the status ${interaction.status}.`,
    };
  }
  return { ok: true, value: interaction };
}

function isGeminiUrl(uri: string): boolean {
  return (
    URL.canParse(uri) && new URL(uri).origin === new URL(geminiApiUrl).origin
  );
}

async function videoBytes(options: {
  connection: VideoConnection;
  output: VideoOutput;
}): Promise<Outcome<Buffer, string>> {
  const { output, connection } = options;
  if (output.kind === "data") return { ok: true, value: output.bytes };
  const request = isGeminiUrl(output.uri)
    ? geminiRequest({ url: output.uri, apiKey: connection.apiKey })
    : new Request(output.uri);
  return requestBytes({ sendRequest: connection.sendRequest, request });
}

export async function requestVideo(options: {
  connection: VideoConnection;
  body: Record<string, unknown>;
}): Promise<Outcome<FinishedVideo, string>> {
  const { connection } = options;
  const created = await readInteraction({
    connection,
    request: geminiRequest({
      url: `${geminiApiUrl}/interactions`,
      apiKey: connection.apiKey,
      body: options.body,
    }),
  });
  if (!created.ok) return created;
  const done = await waitUntilDone({ connection, created: created.value });
  if (!done.ok) return done;
  const output = videoOutputOf(done.value);
  if (!output) {
    return {
      ok: false,
      failure: `The Gemini API finished the interaction ${done.value.id} with no video.`,
    };
  }
  const bytes = await videoBytes({ connection, output });
  if (!bytes.ok) return bytes;
  return {
    ok: true,
    value: {
      bytes: bytes.value,
      mimeType: output.mimeType,
      videoTokens: videoTokensOf(done.value),
    },
  };
}
