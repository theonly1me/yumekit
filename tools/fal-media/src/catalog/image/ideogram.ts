import { falPage } from "../shapes.ts";
import { backgroundField, sizeFields } from "./fields.ts";
import type { ImageModel } from "./types.ts";

const textEndpoint = "ideogram/v4.6";
const areaPixels = 2048 * 2048;

const usdByQuality = { very_low: 0.008, low: 0.03, medium: 0.06, high: 0.1 };

export const ideogram46: ImageModel = {
  id: "ideogram/v4.6",
  label: "Ideogram 4.6",
  isDefault: false,
  readOn: "2026-11-22",
  tested: false,
  sources: [falPage(textEndpoint)],
  choiceSettings: [
    {
      name: "quality",
      label: "Quality",
      choices: Object.keys(usdByQuality),
      default: "medium",
    },
  ],
  transparentBackground: true,
  prices: Object.entries(usdByQuality).map(([quality, usd]) => ({
    usd,
    unit: "image",
    when: { quality },
  })),
  textToImage: (request) => ({
    endpointId: textEndpoint,
    fields: {
      ...sizeFields({ request, areaPixels }),
      ...backgroundField(request),
      quality: request.choices.quality,
      num_images: 1,
    },
  }),
};
