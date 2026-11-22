import type { EndpointCall } from "../endpointCall.ts";
import type { ModelPrice } from "../prices.ts";

export type { EndpointCall } from "../endpointCall.ts";

export interface VideoRequest {
  prompt: string;
  durationSeconds: number;
  resolution: string;
  withAudio: boolean;
  aspectRatio: string;
}

export type FirstFrameRequest = VideoRequest & {
  firstFrameUrl: string;
  lastFrameUrl?: string;
};

export type ReferenceRequest = VideoRequest & {
  referenceImageUrls: string[];
};

export type SoundControl = "switch" | "always" | "none";

export interface VideoModel {
  id: string;
  label: string;
  isDefault: boolean;
  readOn: string;
  tested: boolean;
  sources: readonly string[];
  durationSeconds: {
    minimum: number;
    maximum: number;
    default: number;
    allowed?: readonly number[];
  };
  resolutions: readonly string[];
  defaultResolution: string;
  aspectRatios: readonly string[];
  sound: SoundControl;
  prices: readonly ModelPrice[];
  textToVideo: (request: VideoRequest) => EndpointCall;
  firstFrame: {
    acceptsLastFrame: boolean;
    lastFrameMaximumSeconds?: number;
    call: (request: FirstFrameRequest) => EndpointCall;
  };
  references?: {
    maximum: number;
    call: (request: ReferenceRequest) => EndpointCall;
  };
}
