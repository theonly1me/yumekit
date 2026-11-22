import type {
  CatalogEntry,
  MediaModelPrice,
  MediaModelSetting,
} from "../describe/mediaServerDescription.ts";

export interface ImageModelFacts {
  id: string;
  label: string;
  isDefault: boolean;
  aspectRatios: string[];
  imageSizes: string[];
  maximumReferenceImages: number;
  prices: MediaModelPrice[];
  sourceUrl: string;
}

const readOn = "2026-11-22";

const imageGuide = "https://aistudio.google.com/docs/image-generation";

const commonRatios = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
];

const tallAndWideRatios = [...commonRatios, "1:4", "4:1", "1:8", "8:1"];

const threeSizes = ["1K", "2K", "4K"];

function pricesBySize(usdBySize: [string, number][]): MediaModelPrice[] {
  return usdBySize.map(([size, usd]) => ({
    usd,
    unit: "image",
    when: { resolution: size },
  }));
}

export const imageModels: ImageModelFacts[] = [
  {
    id: "gemini-nano-banana-2.1",
    label: "Nano Banana 2.1",
    isDefault: true,
    aspectRatios: tallAndWideRatios,
    imageSizes: threeSizes,
    maximumReferenceImages: 14,
    prices: pricesBySize([
      ["1K", 0.0336],
      ["2K", 0.0504],
      ["4K", 0.113],
    ]),
    sourceUrl: imageGuide,
  },
  {
    id: "gemini-3.1-flash-image",
    label: "Gemini 3.1 Flash Image",
    isDefault: false,
    aspectRatios: tallAndWideRatios,
    imageSizes: threeSizes,
    maximumReferenceImages: 14,
    prices: pricesBySize([
      ["1K", 0.067],
      ["2K", 0.101],
      ["4K", 0.151],
    ]),
    sourceUrl: imageGuide,
  },
  {
    id: "gemini-3-pro-image",
    label: "Gemini 3 Pro Image",
    isDefault: false,
    aspectRatios: commonRatios,
    imageSizes: threeSizes,
    maximumReferenceImages: 14,
    prices: pricesBySize([
      ["1K", 0.134],
      ["2K", 0.134],
      ["4K", 0.24],
    ]),
    sourceUrl: imageGuide,
  },
  {
    id: "gemini-3.1-flash-lite-image",
    label: "Gemini 3.1 Flash-Lite Image",
    isDefault: false,
    aspectRatios: commonRatios,
    imageSizes: [],
    maximumReferenceImages: 0,
    prices: [{ usd: 0.0336, unit: "image", when: {} }],
    sourceUrl:
      "https://aistudio.google.com/docs/models/gemini-3.1-flash-lite-image",
  },
];

export const defaultImageSize = "1K";

function settingsOf(facts: ImageModelFacts): MediaModelSetting[] {
  const resolution: MediaModelSetting[] =
    facts.imageSizes.length === 0
      ? []
      : [
          {
            name: "resolution",
            label: "Resolution",
            kind: "choice",
            choices: facts.imageSizes,
            default: defaultImageSize,
          },
        ];
  const references: MediaModelSetting[] =
    facts.maximumReferenceImages === 0
      ? []
      : [
          {
            name: "reference_image_paths",
            label: "Reference images",
            kind: "image-files",
            maximum: facts.maximumReferenceImages,
          },
        ];
  return [...resolution, ...references];
}

export const imageCatalog: CatalogEntry[] = imageModels.map((facts) => ({
  sourceUrl: facts.sourceUrl,
  model: {
    id: facts.id,
    label: facts.label,
    capability: "image",
    is_default: facts.isDefault,
    settings: settingsOf(facts),
    prices: facts.prices,
    read_on: readOn,
    accepts: facts.maximumReferenceImages === 0 ? [] : ["reference_images"],
    tested: false,
  },
}));
