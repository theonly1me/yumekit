import type { EndpointCall } from "../endpointCall.ts";
import type { ModelPrice } from "../prices.ts";
import { falPage } from "../shapes.ts";
import type { SharpenKind } from "../sharper/index.ts";

export interface TalkingRequest {
  mediaUrl: string;
  audioUrl: string;
  prompt: string | undefined;
  resolution: string;
}

export interface TalkingResolutions {
  choices: readonly string[];
  default: string;
}

export interface LongVoiceFactor {
  afterSeconds: number;
  factor: number;
}

export interface TalkingModel {
  id: string;
  label: string;
  isDefault: boolean;
  readOn: string;
  tested: boolean;
  sources: readonly string[];
  prices: readonly ModelPrice[];
  takes: SharpenKind;
  resolutions: TalkingResolutions | undefined;
  minimumVoiceSeconds: number | undefined;
  longVoiceFactor: LongVoiceFactor | undefined;
  call: (request: TalkingRequest) => EndpointCall;
}

export function talkingModel(options: {
  endpointId: string;
  label: string;
  takes: SharpenKind;
  prices: readonly ModelPrice[];
  isDefault?: boolean;
  resolutions?: TalkingResolutions;
  minimumVoiceSeconds?: number;
  longVoiceFactor?: LongVoiceFactor;
  fields: (request: TalkingRequest) => Record<string, unknown>;
}): TalkingModel {
  const { endpointId } = options;
  return {
    id: endpointId,
    label: options.label,
    isDefault: options.isDefault ?? false,
    readOn: "2026-11-23",
    tested: false,
    sources: [falPage(endpointId)],
    prices: options.prices,
    takes: options.takes,
    resolutions: options.resolutions,
    minimumVoiceSeconds: options.minimumVoiceSeconds,
    longVoiceFactor: options.longVoiceFactor,
    call: (request) => ({ endpointId, fields: options.fields(request) }),
  };
}

interface FieldOptions {
  request: TalkingRequest;
  field: string;
}

export function mediaField(options: FieldOptions) {
  const { request } = options;
  return { [options.field]: request.mediaUrl, audio_url: request.audioUrl };
}

export function promptField(options: FieldOptions) {
  const { prompt } = options.request;
  return prompt === undefined || prompt === ""
    ? {}
    : { [options.field]: prompt };
}
