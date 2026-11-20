import type { SendRequest } from "../falApi.ts";
import type { Outcome } from "../toolResults.ts";
import type { CheckedVideoInput } from "./checkVideoInput.ts";
import {
  readFrameImage,
  uploadFrameImage,
  type FrameImage,
} from "./frameImages.ts";
import type { Wait } from "./runQueueRequest.ts";

export interface EndpointCall {
  endpointId: string;
  fields: Record<string, unknown>;
}

function sharedRequest(input: CheckedVideoInput) {
  return {
    prompt: input.prompt,
    durationSeconds: input.durationSeconds,
    resolution: input.resolution,
    withAudio: input.withAudio,
  };
}

export interface MakeVideoOptions {
  input: CheckedVideoInput;
  sendRequest: SendRequest;
  apiKey: string;
  wait: Wait;
  signal: AbortSignal;
  onPoll: (status: string) => Promise<void>;
}

async function readOptionalFrame(options: {
  path: string | undefined;
  field: string;
}): Promise<Outcome<FrameImage | undefined, string>> {
  if (options.path === undefined) return { ok: true, value: undefined };
  return readFrameImage({ path: options.path, field: options.field });
}

async function uploadedUrl(options: {
  image: FrameImage;
  field: string;
  sendRequest: SendRequest;
  apiKey: string;
}): Promise<Outcome<string, string>> {
  const uploaded = await uploadFrameImage(options);
  if (uploaded.ok) return uploaded;
  return {
    ok: false,
    failure: `Cannot upload ${options.field}: ${uploaded.failure.message}`,
  };
}

async function imageCall(
  options: MakeVideoOptions & {
    firstImage: FrameImage;
    lastImage?: FrameImage;
  },
): Promise<Outcome<EndpointCall, string>> {
  const { input } = options;
  const firstFrameUrl = await uploadedUrl({
    ...options,
    image: options.firstImage,
    field: "first_frame_path",
  });
  if (!firstFrameUrl.ok) return firstFrameUrl;
  let lastFrameUrl: string | undefined;
  if (options.lastImage !== undefined) {
    const uploaded = await uploadedUrl({
      ...options,
      image: options.lastImage,
      field: "last_frame_path",
    });
    if (!uploaded.ok) return uploaded;
    lastFrameUrl = uploaded.value;
  }
  const endpoint = input.model.imageToVideo;
  return {
    ok: true,
    value: {
      endpointId: endpoint.endpointId,
      fields: endpoint.fieldsOf({
        ...sharedRequest(input),
        firstFrameUrl: firstFrameUrl.value,
        ...(lastFrameUrl === undefined ? {} : { lastFrameUrl }),
      }),
    },
  };
}

export async function endpointCall(
  options: MakeVideoOptions,
): Promise<Outcome<EndpointCall, string>> {
  const { input } = options;
  const firstImage = await readOptionalFrame({
    path: input.firstFramePath,
    field: "first_frame_path",
  });
  if (!firstImage.ok) return firstImage;
  const lastImage = await readOptionalFrame({
    path: input.lastFramePath,
    field: "last_frame_path",
  });
  if (!lastImage.ok) return lastImage;
  if (firstImage.value !== undefined) {
    return imageCall({
      ...options,
      firstImage: firstImage.value,
      ...(lastImage.value === undefined ? {} : { lastImage: lastImage.value }),
    });
  }
  const endpoint = input.model.textToVideo;
  return {
    ok: true,
    value: {
      endpointId: endpoint.endpointId,
      fields: endpoint.fieldsOf({
        ...sharedRequest(input),
        aspectRatio: input.aspectRatio,
      }),
    },
  };
}
