export type OpenAiCapability = "image" | "speech" | "align";

export type CatalogSetting = { name: string; label: string } & (
  | { kind: "switch"; default: boolean }
  | { kind: "choice"; choices: string[]; default: string }
  | { kind: "image-files"; maximum: number }
);

export interface CatalogPrice {
  usd: number;
  unit: "image" | "minute" | "thousand-characters";
  when: Record<string, string>;
}

export interface CatalogModel {
  id: string;
  label: string;
  capability: OpenAiCapability;
  settings: CatalogSetting[];
  prices: CatalogPrice[];
  shutdown_on?: string;
  accepts?: "reference_images"[];
  tested?: boolean;
}

export interface CatalogEntry {
  model: CatalogModel;
  sourceUrl: string;
}
