import { z } from "zod";
import { matchingPrice, roundedUsd } from "../catalog/prices.ts";
import { downloadFile } from "../download/downloadFile.ts";
import { pictureFacts } from "../image/pictureFile.ts";
import {
  runQueueRequest,
  type QueueOptions,
} from "../queue/runQueueRequest.ts";
import {
  writeOutputFile,
  type MediaFile,
  type MediaToolResult,
  type Outcome,
} from "../toolResults.ts";
import { uploadFrameImage } from "../upload/imageFiles.ts";
import { readMp4Facts } from "../video/mp4Facts.ts";
import type { CheckedSharpenInput } from "./checkSharpenInput.ts";

const falFile = z.object({ url: z.url() });

const videoOutput = z
  .object({ video: falFile })
  .transform((output) => output.video.url);

const imageOutput = z
  .union([
    z.object({ image: falFile }),
    z.object({ images: z.array(falFile).min(1) }),
  ])
  .transform((output) =>
    "image" in output ? output.image.url : output.images[0]?.url,
  );

function fileOf(options: {
  input: CheckedSharpenInput;
  bytes: Buffer;
}): Outcome<{ fileName: string; file: Omit<MediaFile, "path"> }, string> {
  const { input, bytes } = options;
  if (input.media.kind === "video") {
    const facts = readMp4Facts(bytes);
    return {
      ok: true,
      value: {
        fileName: `${input.fileStem}.mp4`,
        file: {
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
      },
    };
  }
  const facts = pictureFacts(bytes);
  if (facts === undefined) {
    return {
      ok: false,
      failure: "fal sent a picture that is not a PNG, JPEG, or WebP file.",
    };
  }
  return {
    ok: true,
    value: {
      fileName: `${input.fileStem}.${facts.extension}`,
      file: {
        kind: "image",
        ...(facts.widthPixels === undefined
          ? {}
          : { width_pixels: facts.widthPixels }),
        ...(facts.heightPixels === undefined
          ? {}
          : { height_pixels: facts.heightPixels }),
      },
    },
  };
}

function costFields(options: {
  input: CheckedSharpenInput;
  durationSeconds: number | undefined;
}) {
  const price = matchingPrice({
    prices: options.input.model.prices,
    values: {},
  });
  if (price === undefined) return {};
  const usd =
    price.unit === "image"
      ? price.usd
      : options.durationSeconds === undefined
        ? undefined
        : price.usd * options.durationSeconds;
  return usd === undefined
    ? {}
    : { cost_usd: roundedUsd(usd), cost_is_estimate: true as const };
}

export async function sharpenMedia(
  options: QueueOptions & { input: CheckedSharpenInput },
): Promise<Outcome<MediaToolResult, string>> {
  const { input } = options;
  const uploaded = await uploadFrameImage({ ...options, image: input.media });
  if (!uploaded.ok) {
    return {
      ok: false,
      failure: `Cannot upload media_path: ${uploaded.failure.message}`,
    };
  }
  const output = await runQueueRequest({
    ...options,
    ...input.model.call({ mediaUrl: uploaded.value, scale: input.scale }),
    output: input.media.kind === "video" ? videoOutput : imageOutput,
  });
  if (!output.ok) return { ok: false, failure: output.failure.message };
  const url = output.value;
  if (url === undefined) throw new Error("The picture list is empty");
  const bytes = await downloadFile({
    sendRequest: options.sendRequest,
    url,
    what: "sharper copy",
  });
  if (!bytes.ok) return bytes;
  const made = fileOf({ input, bytes: bytes.value });
  if (!made.ok) return made;
  const written = await writeOutputFile({
    outputDirectory: input.outputDirectory,
    fileName: made.value.fileName,
    bytes: bytes.value,
  });
  if (!written.ok) return written;
  const durationSeconds =
    made.value.file.duration_seconds ??
    readMp4Facts(input.media.bytes).durationSeconds;
  return {
    ok: true,
    value: {
      files: [{ path: written.value, ...made.value.file }],
      ...costFields({ input, durationSeconds }),
    },
  };
}
