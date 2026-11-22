import type { EndpointCall } from "../catalog/video/index.ts";
import type { SendRequest } from "../falApi.ts";
import type { Wait } from "../queue/runQueueRequest.ts";
import type { Outcome } from "../toolResults.ts";
import {
  pathEntries,
  readImages,
  uploadImages,
} from "../upload/uploadImages.ts";
import type { CheckedVideoInput } from "./checkVideoInput.ts";

export interface MakeVideoOptions {
  input: CheckedVideoInput;
  sendRequest: SendRequest;
  apiKey: string;
  wait: Wait;
  signal: AbortSignal;
  onPoll: (status: string) => Promise<void>;
}

function sharedRequest(input: CheckedVideoInput) {
  return {
    prompt: input.prompt,
    durationSeconds: input.durationSeconds,
    resolution: input.resolution,
    withAudio: input.withAudio,
    aspectRatio: input.aspectRatio,
  };
}

function framePaths(input: CheckedVideoInput) {
  return [
    ...pathEntries({
      field: "first_frame_path",
      paths: input.firstFramePath === undefined ? [] : [input.firstFramePath],
    }),
    ...pathEntries({
      field: "last_frame_path",
      paths: input.lastFramePath === undefined ? [] : [input.lastFramePath],
    }),
    ...pathEntries({
      field: "reference_image_paths",
      paths: input.referenceImagePaths,
    }),
  ];
}

function callWithUrls(options: {
  input: CheckedVideoInput;
  urls: string[];
}): EndpointCall {
  const { input, urls } = options;
  const { model } = input;
  const request = sharedRequest(input);
  const [firstFrameUrl, lastFrameUrl] = urls;
  if (input.firstFramePath !== undefined && firstFrameUrl !== undefined) {
    return model.firstFrame.call({
      ...request,
      firstFrameUrl,
      ...(lastFrameUrl === undefined ? {} : { lastFrameUrl }),
    });
  }
  if (model.references !== undefined && urls.length > 0) {
    return model.references.call({ ...request, referenceImageUrls: urls });
  }
  return model.textToVideo(request);
}

export async function endpointCall(
  options: MakeVideoOptions,
): Promise<Outcome<EndpointCall, string>> {
  const images = await readImages(framePaths(options.input));
  if (!images.ok) return images;
  const urls = await uploadImages({ ...options, images: images.value });
  if (!urls.ok) return urls;
  return {
    ok: true,
    value: callWithUrls({ input: options.input, urls: urls.value }),
  };
}
