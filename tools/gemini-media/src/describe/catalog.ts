import { imageCatalog } from "../image/imageModels.ts";
import { musicCatalog } from "../music/musicModels.ts";
import { speechCatalog } from "../speech/speechModels.ts";
import { videoCatalog } from "../video/videoCatalog.ts";
import type {
  CatalogEntry,
  MediaServerDescription,
} from "./mediaServerDescription.ts";

export const catalogEntries: CatalogEntry[] = [
  ...imageCatalog,
  ...speechCatalog,
  ...musicCatalog,
  ...videoCatalog,
];

export const catalog: MediaServerDescription = {
  label: "Google Gemini",
  runs: "hosted",
  keys: [
    {
      variable: "GEMINI_API_KEY",
      label: "Gemini API key",
      get_key_url: "https://aistudio.google.com/apikey",
      steps: [
        "Open Google AI Studio and sign in with your Google account.",
        "On the API Keys page, create a key in a Google Cloud project.",
        "Set up billing for that project, because video has no free tier.",
        "Copy the key and save it as GEMINI_API_KEY.",
      ],
    },
  ],
  models: catalogEntries.map((entry) => entry.model),
};
