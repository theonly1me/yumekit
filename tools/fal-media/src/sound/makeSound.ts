import { z } from "zod";
import { matchingPrice, roundedUsd } from "../catalog/prices.ts";
import { downloadFile, soundExtensionOf } from "../download/downloadFile.ts";
import {
  runQueueRequest,
  type QueueOptions,
} from "../queue/runQueueRequest.ts";
import {
  writeOutputFile,
  type MediaToolResult,
  type Outcome,
} from "../toolResults.ts";
import type { CheckedSoundInput } from "./checkSoundInput.ts";

const falFile = z.object({ url: z.url() });

const soundOutput = z.object({
  audio: z.union([falFile, z.array(falFile).min(1)]),
});

function costFields(input: CheckedSoundInput) {
  const price = matchingPrice({ prices: input.model.prices, values: {} });
  if (price === undefined || input.durationSeconds === undefined) return {};
  return {
    cost_usd: roundedUsd(price.usd * input.durationSeconds),
    cost_is_estimate: true as const,
  };
}

export async function makeSound(
  options: QueueOptions & { input: CheckedSoundInput },
): Promise<Outcome<MediaToolResult, string>> {
  const { input } = options;
  const output = await runQueueRequest({
    ...options,
    ...input.model.call({
      prompt: input.prompt,
      durationSeconds: input.durationSeconds,
    }),
    output: soundOutput,
  });
  if (!output.ok) return { ok: false, failure: output.failure.message };
  const { audio } = output.value;
  const [file] = Array.isArray(audio) ? audio : [audio];
  if (file === undefined) throw new Error("The sound list is empty");
  const bytes = await downloadFile({
    sendRequest: options.sendRequest,
    url: file.url,
    what: "sound",
  });
  if (!bytes.ok) return bytes;
  const written = await writeOutputFile({
    outputDirectory: input.outputDirectory,
    fileName: `${input.fileStem}.${soundExtensionOf(file.url)}`,
    bytes: bytes.value,
  });
  if (!written.ok) return written;
  return {
    ok: true,
    value: {
      files: [{ path: written.value, kind: "audio" }],
      ...costFields(input),
    },
  };
}
