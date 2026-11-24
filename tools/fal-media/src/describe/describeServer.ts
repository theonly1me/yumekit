import { imageModels } from "../catalog/image/index.ts";
import { sharperModels } from "../catalog/sharper/index.ts";
import { soundModels } from "../catalog/sound/index.ts";
import { talkingModels } from "../catalog/talking/index.ts";
import { videoAccepts, videoModels } from "../catalog/video/index.ts";
import { getKeyUrl } from "../falApi.ts";
import {
  imageAccepts,
  imageSettings,
  sharperSettings,
  soundSettings,
  talkingSettings,
  videoSettings,
} from "./settings.ts";

interface CatalogEntry {
  id: string;
  label: string;
  isDefault: boolean;
  readOn: string;
  tested: boolean;
  prices: readonly {
    usd: number;
    unit: string;
    when: Readonly<Record<string, string>>;
  }[];
}

function sharedFields(model: CatalogEntry) {
  return {
    id: model.id,
    label: model.label,
    is_default: model.isDefault,
    prices: model.prices.map((price) => ({
      ...price,
      when: { ...price.when },
    })),
    read_on: model.readOn,
    tested: model.tested,
  };
}

export function describeServer() {
  return {
    label: "fal",
    runs: "hosted" as const,
    keys: [
      {
        variable: "FAL_KEY",
        label: "fal API key",
        get_key_url: getKeyUrl,
        steps: [
          "Sign in to fal.ai.",
          "Open the keys page of the dashboard.",
          "Add a key with the API preset.",
          "Copy the key. fal shows it one time only.",
        ],
      },
    ],
    models: [
      ...imageModels.map((model) => ({
        ...sharedFields(model),
        capability: "image" as const,
        settings: imageSettings(model),
        accepts: imageAccepts(model),
      })),
      ...videoModels.map((model) => ({
        ...sharedFields(model),
        capability: "video" as const,
        settings: videoSettings(model),
        accepts: videoAccepts(model),
      })),
      ...soundModels.map((model) => ({
        ...sharedFields(model),
        capability: "sound-effect" as const,
        settings: soundSettings(model),
        accepts: ["length"],
      })),
      ...talkingModels.map((model) => ({
        ...sharedFields(model),
        capability: "talking-clip" as const,
        settings: talkingSettings(model),
        accepts: [model.takes === "image" ? "image_input" : "video_input"],
      })),
      ...sharperModels.map((model) => ({
        ...sharedFields(model),
        capability: "sharper" as const,
        settings: sharperSettings,
        accepts: [model.takes === "image" ? "image_input" : "video_input"],
      })),
    ],
  };
}
