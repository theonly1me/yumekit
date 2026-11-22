import type { EndpointCall } from "../catalog/image/types.ts";
import type { SendRequest } from "../falApi.ts";
import type { Outcome } from "../toolResults.ts";
import {
  pathEntries,
  readImages,
  uploadImages,
} from "../upload/uploadImages.ts";
import type { CheckedImageInput } from "./checkImageInput.ts";

export async function imageCall(options: {
  input: CheckedImageInput;
  sendRequest: SendRequest;
  apiKey: string;
}): Promise<Outcome<EndpointCall, string>> {
  const { input } = options;
  const images = await readImages(
    pathEntries({
      field: "reference_image_paths",
      paths: input.referenceImagePaths,
    }),
  );
  if (!images.ok) return images;
  const urls = await uploadImages({ ...options, images: images.value });
  if (!urls.ok) return urls;
  const request = {
    prompt: input.prompt,
    widthPixels: input.widthPixels,
    heightPixels: input.heightPixels,
    choices: input.choices,
    transparentBackground: input.transparentBackground,
  };
  const { references } = input.model;
  const call =
    references !== undefined && urls.value.length > 0
      ? references.call({ ...request, referenceImageUrls: urls.value })
      : input.model.textToImage(request);
  return { ok: true, value: call };
}
