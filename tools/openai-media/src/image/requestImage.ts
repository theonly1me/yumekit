import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { z } from "zod";
import {
  formRequest,
  jsonRequest,
  requestJson,
  type SendRequest,
} from "../openAiApi.ts";
import { errorMessage, type Outcome } from "../toolResults.ts";

export interface ImageRequest {
  sendRequest: SendRequest;
  apiKey: string;
  model: string;
  prompt: string;
  size: string;
  transparentBackground: boolean;
  referenceImagePaths: string[];
}

const imageResponse = z.object({
  data: z.array(z.object({ b64_json: z.string().min(1) })).min(1),
});

const imageTypesByExtension: Partial<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function sharedFields(request: ImageRequest): Record<string, string> {
  return {
    model: request.model,
    prompt: request.prompt,
    size: request.size,
    background: request.transparentBackground ? "transparent" : "auto",
    output_format: "png",
  };
}

async function readReferenceImage(
  path: string,
): Promise<Outcome<File, string>> {
  const type = imageTypesByExtension[extname(path).toLowerCase()];
  if (!type) {
    return {
      ok: false,
      failure: `${path} is not a PNG, JPEG, or WebP file.`,
    };
  }
  try {
    const bytes = await readFile(path);
    return { ok: true, value: new File([bytes], basename(path), { type }) };
  } catch (error) {
    return {
      ok: false,
      failure: `Cannot read ${path}: ${errorMessage(error)}`,
    };
  }
}

async function editRequest(
  request: ImageRequest,
): Promise<Outcome<Request, string>> {
  const form = new FormData();
  for (const [name, value] of Object.entries(sharedFields(request))) {
    form.append(name, value);
  }
  form.append("n", "1");
  for (const path of request.referenceImagePaths) {
    const image = await readReferenceImage(path);
    if (!image.ok) return image;
    form.append("image[]", image.value);
  }
  return {
    ok: true,
    value: formRequest({
      path: "/images/edits",
      apiKey: request.apiKey,
      form,
    }),
  };
}

function generationRequest(request: ImageRequest): Request {
  return jsonRequest({
    path: "/images/generations",
    apiKey: request.apiKey,
    body: { ...sharedFields(request), n: 1 },
  });
}

async function buildRequest(
  request: ImageRequest,
): Promise<Outcome<Request, string>> {
  if (request.referenceImagePaths.length > 0) return editRequest(request);
  return { ok: true, value: generationRequest(request) };
}

export async function requestImage(
  request: ImageRequest,
): Promise<Outcome<Buffer, string>> {
  const httpRequest = await buildRequest(request);
  if (!httpRequest.ok) return httpRequest;
  const sent = await requestJson({
    sendRequest: request.sendRequest,
    request: httpRequest.value,
  });
  if (!sent.ok) return sent;
  const body = imageResponse.safeParse(sent.value);
  if (!body.success) {
    return {
      ok: false,
      failure: `The OpenAI API sent no image: ${body.error.message}`,
    };
  }
  const [image] = body.data.data;
  if (!image) return { ok: false, failure: "The OpenAI API sent no image." };
  return { ok: true, value: Buffer.from(image.b64_json, "base64") };
}
