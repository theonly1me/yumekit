import type { CatalogEntry } from "./catalogModel.ts";

export const maximumReferenceImages = 16;

function imageModel(options: {
  id: string;
  label: string;
  tested?: boolean;
}): CatalogEntry {
  return {
    sourceUrl: `https://developers.openai.com/api/docs/models/${options.id}`,
    model: {
      id: options.id,
      label: options.label,
      capability: "image",
      settings: [
        {
          name: "transparent_background",
          label: "Transparent background",
          kind: "switch",
          default: false,
        },
        {
          name: "reference_image_paths",
          label: "Reference images",
          kind: "image-files",
          maximum: maximumReferenceImages,
        },
      ],
      prices: [],
      accepts: ["reference_images"],
      ...(options.tested === undefined ? {} : { tested: options.tested }),
    },
  };
}

export const imageEntries: CatalogEntry[] = [
  imageModel({ id: "gpt-image-2.5-flare", label: "GPT Image 2.5 Flare" }),
  imageModel({
    id: "gpt-image-2.5-sunburst",
    label: "GPT Image 2.5 Sunburst",
    tested: false,
  }),
  imageModel({
    id: "gpt-image-2.6-flare",
    label: "GPT Image 2.6 Flare",
    tested: false,
  }),
  imageModel({
    id: "gpt-image-2.6-sunburst",
    label: "GPT Image 2.6 Sunburst",
    tested: false,
  }),
];
