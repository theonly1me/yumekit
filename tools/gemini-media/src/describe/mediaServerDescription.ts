export interface MediaServerDescription {
  label: string;
  runs: "hosted" | "on-this-computer";
  keys: MediaServerKey[];
  models: MediaModel[];
}

export interface MediaServerKey {
  variable: string;
  label: string;
  get_key_url: string;
  steps: string[];
}

export interface MediaModel {
  id: string;
  label: string;
  capability: "image" | "speech" | "align" | "music" | "video";
  is_default: boolean;
  settings: MediaModelSetting[];
  prices: MediaModelPrice[];
  read_on: string;
  shutdown_on?: string;
  accepts?: MediaModelInput[];
  tested?: boolean;
}

export type MediaModelInput = "first_frame" | "last_frame" | "reference_images";

export interface CatalogEntry {
  model: MediaModel;
  sourceUrl: string;
}

export type MediaModelSetting =
  | {
      name: string;
      label: string;
      kind: "choice";
      choices: string[];
      default: string;
    }
  | {
      name: string;
      label: string;
      kind: "whole-number";
      minimum: number;
      maximum: number;
      default: number;
    }
  | { name: string; label: string; kind: "switch"; default: boolean }
  | { name: string; label: string; kind: "image-file" }
  | { name: string; label: string; kind: "image-files"; maximum: number };

export interface MediaModelPrice {
  usd: number;
  unit: "second" | "image" | "minute" | "thousand-characters";
  when: Record<string, string>;
}
