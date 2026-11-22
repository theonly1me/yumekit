import { z } from "zod";
import { matchingPrice, roundedUsd } from "../catalog/prices.ts";
import { requestBytes } from "../falApi.ts";
import {
  runQueueRequest,
  type QueueOptions,
} from "../queue/runQueueRequest.ts";
import {
  writeOutputFile,
  type MediaToolResult,
  type Outcome,
} from "../toolResults.ts";
import type { CheckedImageInput } from "./checkImageInput.ts";
import { imageCall } from "./imageCall.ts";
import { pictureFacts } from "./pictureFile.ts";

const imageOutput = z.object({
  images: z
    .array(
      z.object({
        url: z.url(),
        width: z.int().positive().nullish(),
        height: z.int().positive().nullish(),
      }),
    )
    .min(1),
});

function costFields(input: CheckedImageInput) {
  const price = matchingPrice({
    prices: input.model.prices,
    values: input.choices,
  });
  if (price === undefined) return {};
  const referenceUsd =
    (input.model.usdForEachReferenceImage ?? 0) *
    input.referenceImagePaths.length;
  return {
    cost_usd: roundedUsd(price.usd + referenceUsd),
    cost_is_estimate: true as const,
  };
}

export async function makeImage(
  options: QueueOptions & { input: CheckedImageInput },
): Promise<Outcome<MediaToolResult, string>> {
  const call = await imageCall(options);
  if (!call.ok) return call;
  const output = await runQueueRequest({
    ...options,
    ...call.value,
    output: imageOutput,
  });
  if (!output.ok) return { ok: false, failure: output.failure.message };
  const [image] = output.value.images;
  if (image === undefined) throw new Error("The image list is empty");
  const bytes = await requestBytes({
    sendRequest: options.sendRequest,
    request: new Request(image.url),
  });
  if (!bytes.ok) {
    return {
      ok: false,
      failure: `Cannot download the picture from ${image.url}: ${bytes.failure.message}`,
    };
  }
  const facts = pictureFacts(bytes.value);
  if (facts === undefined) {
    return {
      ok: false,
      failure: `fal sent a picture that is not a PNG, JPEG, or WebP file: ${image.url}`,
    };
  }
  const written = await writeOutputFile({
    outputDirectory: options.input.outputDirectory,
    fileName: `${options.input.fileStem}.${facts.extension}`,
    bytes: bytes.value,
  });
  if (!written.ok) return written;
  const widthPixels = image.width ?? facts.widthPixels;
  const heightPixels = image.height ?? facts.heightPixels;
  return {
    ok: true,
    value: {
      files: [
        {
          path: written.value,
          kind: "image",
          ...(widthPixels === undefined ? {} : { width_pixels: widthPixels }),
          ...(heightPixels === undefined
            ? {}
            : { height_pixels: heightPixels }),
        },
      ],
      ...costFields(options.input),
    },
  };
}
