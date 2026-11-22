import type { EndpointCall } from "../endpointCall.ts";
import type { ModelPrice } from "../prices.ts";
import type { RequestedShape } from "../shapes.ts";

export type { EndpointCall } from "../endpointCall.ts";

export type ImageChoiceName = "resolution" | "quality";

export interface ImageChoiceSetting {
  name: ImageChoiceName;
  label: string;
  choices: readonly string[];
  default: string;
}

export type ImageRequest = RequestedShape & {
  prompt: string;
  choices: Readonly<Partial<Record<ImageChoiceName, string>>>;
  transparentBackground: boolean;
};

export type ReferenceImageRequest = ImageRequest & {
  referenceImageUrls: string[];
};

export interface ImageModel {
  id: string;
  label: string;
  isDefault: boolean;
  readOn: string;
  tested: boolean;
  sources: readonly string[];
  choiceSettings: readonly ImageChoiceSetting[];
  transparentBackground: boolean;
  prices: readonly ModelPrice[];
  usdForEachReferenceImage?: number;
  textToImage: (request: ImageRequest) => EndpointCall;
  references?: {
    maximum: number;
    call: (request: ReferenceImageRequest) => EndpointCall;
  };
}
