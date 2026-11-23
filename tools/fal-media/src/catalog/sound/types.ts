import type { EndpointCall } from "../endpointCall.ts";
import type { ModelPrice } from "../prices.ts";

export interface SoundRequest {
  prompt: string;
  durationSeconds: number | undefined;
}

export interface SoundModel {
  id: string;
  label: string;
  isDefault: boolean;
  readOn: string;
  tested: boolean;
  sources: readonly string[];
  prices: readonly ModelPrice[];
  durationSeconds: { minimum: number; maximum: number; default: number };
  call: (request: SoundRequest) => EndpointCall;
}
