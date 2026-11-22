import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { z } from "zod";
import {
  authorization,
  falUrls,
  requestJson,
  sendToFal,
  type FalFailure,
  type SendRequest,
} from "../falApi.ts";
import { errorMessage, type Outcome } from "../toolResults.ts";

export interface FrameImage {
  fileName: string;
  contentType: string;
  bytes: Buffer;
}

export const maximumImageBytes = 30 * 1024 * 1024;

const imageTypesByExtension: Partial<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const initiatedUpload = z.object({
  upload_url: z.url(),
  file_url: z.url(),
});

export async function readFrameImage(options: {
  path: string;
  field: string;
}): Promise<Outcome<FrameImage, string>> {
  const contentType =
    imageTypesByExtension[extname(options.path).toLowerCase()];
  if (contentType === undefined) {
    return {
      ok: false,
      failure: `${options.field} ${options.path} is not a PNG, JPEG, or WebP file.`,
    };
  }
  let bytes: Buffer;
  try {
    bytes = await readFile(options.path);
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot read ${options.field} ${options.path}: ${errorMessage(error)}`,
    };
  }
  if (bytes.length > maximumImageBytes) {
    return {
      ok: false,
      failure: `${options.field} ${options.path} is larger than 30 MB, the limit of fal for an image.`,
    };
  }
  return {
    ok: true,
    value: { fileName: basename(options.path), contentType, bytes },
  };
}

export async function uploadFrameImage(options: {
  sendRequest: SendRequest;
  apiKey: string;
  image: FrameImage;
}): Promise<Outcome<string, FalFailure>> {
  const initiated = await requestJson({
    sendRequest: options.sendRequest,
    schema: initiatedUpload,
    request: new Request(falUrls.uploadInitiate, {
      method: "POST",
      headers: {
        ...authorization(options.apiKey),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        file_name: options.image.fileName,
        content_type: options.image.contentType,
      }),
    }),
  });
  if (!initiated.ok) return initiated;
  const uploaded = await sendToFal({
    sendRequest: options.sendRequest,
    request: new Request(initiated.value.upload_url, {
      method: "PUT",
      headers: { "content-type": options.image.contentType },
      body: options.image.bytes,
    }),
  });
  if (!uploaded.ok) return uploaded;
  return { ok: true, value: initiated.value.file_url };
}
