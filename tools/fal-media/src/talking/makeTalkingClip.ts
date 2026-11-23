import { z } from "zod";
import { matchingPrice, roundedUsd } from "../catalog/prices.ts";
import { downloadFile } from "../download/downloadFile.ts";
import {
  runQueueRequest,
  type QueueOptions,
} from "../queue/runQueueRequest.ts";
import {
  writeOutputFile,
  type MediaToolResult,
  type Outcome,
} from "../toolResults.ts";
import { uploadFrameImage, type FrameImage } from "../upload/imageFiles.ts";
import { readMp4Facts } from "../video/mp4Facts.ts";
import type { CheckedTalkingInput } from "./checkTalkingInput.ts";

const videoOutput = z
  .object({ video: z.object({ url: z.url() }) })
  .transform((output) => output.video.url);

function costFields(options: {
  input: CheckedTalkingInput;
  seconds: number | undefined;
}) {
  const { input, seconds } = options;
  const price = matchingPrice({
    prices: input.model.prices,
    values: { resolution: input.resolution },
  });
  if (price === undefined || seconds === undefined) return {};
  const long = input.model.longVoiceFactor;
  const factor =
    long !== undefined && seconds > long.afterSeconds ? long.factor : 1;
  return {
    cost_usd: roundedUsd(price.usd * seconds * factor),
    cost_is_estimate: true as const,
  };
}

async function upload(
  options: QueueOptions & { file: FrameImage; field: string },
): Promise<Outcome<string, string>> {
  const uploaded = await uploadFrameImage({ ...options, image: options.file });
  return uploaded.ok
    ? uploaded
    : {
        ok: false,
        failure: `Cannot upload ${options.field}: ${uploaded.failure.message}`,
      };
}

export async function makeTalkingClip(
  options: QueueOptions & { input: CheckedTalkingInput },
): Promise<Outcome<MediaToolResult, string>> {
  const { input } = options;
  const mediaUrl = await upload({
    ...options,
    file: input.media,
    field: "media_path",
  });
  if (!mediaUrl.ok) return mediaUrl;
  const audioUrl = await upload({
    ...options,
    file: input.voice,
    field: "audio_path",
  });
  if (!audioUrl.ok) return audioUrl;
  const output = await runQueueRequest({
    ...options,
    ...input.model.call({
      mediaUrl: mediaUrl.value,
      audioUrl: audioUrl.value,
      prompt: input.prompt,
      resolution: input.resolution,
    }),
    output: videoOutput,
  });
  if (!output.ok) return { ok: false, failure: output.failure.message };
  const bytes = await downloadFile({
    sendRequest: options.sendRequest,
    url: output.value,
    what: "talking clip",
  });
  if (!bytes.ok) return bytes;
  const written = await writeOutputFile({
    outputDirectory: input.outputDirectory,
    fileName: `${input.fileStem}.mp4`,
    bytes: bytes.value,
  });
  if (!written.ok) return written;
  const facts = readMp4Facts(bytes.value);
  const seconds = facts.durationSeconds ?? input.voice.seconds;
  return {
    ok: true,
    value: {
      files: [
        {
          path: written.value,
          kind: "video",
          ...(facts.durationSeconds === undefined
            ? {}
            : { duration_seconds: facts.durationSeconds }),
          ...(facts.widthPixels === undefined
            ? {}
            : { width_pixels: facts.widthPixels }),
          ...(facts.heightPixels === undefined
            ? {}
            : { height_pixels: facts.heightPixels }),
        },
      ],
      ...costFields({ input, seconds }),
    },
  };
}
