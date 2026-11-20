export interface EndpointRequest {
  prompt: string;
  durationSeconds: number;
  resolution: string;
  withAudio: boolean;
}

export type TextRequest = EndpointRequest & { aspectRatio: string };

export type ImageRequest = EndpointRequest & {
  firstFrameUrl: string;
  lastFrameUrl?: string;
};

export interface TextEndpoint {
  endpointId: string;
  fieldsOf: (request: TextRequest) => Record<string, unknown>;
}

export interface ImageEndpoint {
  endpointId: string;
  acceptsLastFrame: boolean;
  fieldsOf: (request: ImageRequest) => Record<string, unknown>;
}

export interface VideoModel {
  id: string;
  label: string;
  isDefault: boolean;
  readOn: string;
  durationSeconds: { minimum: number; maximum: number; default: number };
  resolutions: readonly string[];
  defaultResolution: string;
  aspectRatios: readonly string[];
  usdPerSecondByResolution: Readonly<Partial<Record<string, number>>>;
  textToVideo: TextEndpoint;
  imageToVideo: ImageEndpoint;
}
