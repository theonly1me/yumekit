import type { EndpointCall } from "../endpointCall.ts";
import type { ModelPrice } from "../prices.ts";
import { falPage } from "../shapes.ts";

export type SharpenKind = "image" | "video";

export type SharpenScale = 2 | 4;

export interface SharpenRequest {
  mediaUrl: string;
  scale: SharpenScale;
}

export interface SharperModel {
  id: string;
  label: string;
  isDefault: boolean;
  readOn: string;
  tested: boolean;
  sources: readonly string[];
  prices: readonly ModelPrice[];
  takes: SharpenKind;
  call: (request: SharpenRequest) => EndpointCall;
}

export function sharperModel(options: {
  endpointId: string;
  label: string;
  takes: SharpenKind;
  prices?: readonly ModelPrice[];
  isDefault?: boolean;
  fields: (request: SharpenRequest) => Record<string, unknown>;
}): SharperModel {
  const { endpointId } = options;
  return {
    id: endpointId,
    label: options.label,
    isDefault: options.isDefault ?? false,
    readOn: "2026-11-23",
    tested: false,
    sources: [falPage(endpointId)],
    prices: options.prices ?? [],
    takes: options.takes,
    call: (request) => ({ endpointId, fields: options.fields(request) }),
  };
}
