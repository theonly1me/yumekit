export type OpenAiCapability = "image" | "speech" | "align";

const readOn = "2026-11-21";

export const openAiVoices = [
  "marin",
  "cedar",
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
] as const;

export const apiKeyVariable = "OPENAI_API_KEY";

export const openAiKey = {
  variable: apiKeyVariable,
  label: "OpenAI API key",
  get_key_url: "https://platform.openai.com/api-keys",
  steps: [
    "Sign in to the OpenAI platform.",
    "Open the API keys page.",
    "Select Create new secret key, and copy the key.",
  ],
};

type CatalogSetting = { name: string; label: string } & (
  | { kind: "switch"; default: boolean }
  | { kind: "choice"; choices: string[]; default: string }
  | { kind: "image-files"; maximum: number }
);

interface CatalogPrice {
  usd: number;
  unit: "image" | "minute";
  when: Record<string, string>;
}

export interface CatalogModel {
  id: string;
  label: string;
  capability: OpenAiCapability;
  settings: CatalogSetting[];
  prices: CatalogPrice[];
  shutdown_on?: string;
}

export const catalogModels: CatalogModel[] = [
  {
    id: "gpt-image-2.5-flare",
    label: "GPT Image 2.5 Flare",
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
        maximum: 16,
      },
    ],
    prices: [],
  },
  {
    id: "gpt-4o-mini-tts",
    label: "GPT-4o mini TTS",
    capability: "speech",
    settings: [
      {
        name: "voice",
        label: "Voice",
        kind: "choice",
        choices: [...openAiVoices],
        default: "marin",
      },
    ],
    prices: [],
    shutdown_on: "2027-01-06",
  },
  {
    id: "whisper-1",
    label: "Whisper",
    capability: "align",
    settings: [],
    prices: [{ usd: 0.006, unit: "minute", when: {} }],
    shutdown_on: "2027-02-26",
  },
];

export type ActiveModels = Record<OpenAiCapability, string>;

function modelsOfCapability(options: {
  capability: OpenAiCapability;
  activeModel: string;
}) {
  const { capability, activeModel } = options;
  const fromCatalog = catalogModels.filter(
    (model) => model.capability === capability,
  );
  const extra = fromCatalog.some((model) => model.id === activeModel)
    ? []
    : [
        {
          id: activeModel,
          label: `${activeModel} (from an environment variable)`,
          capability,
          settings: [],
          prices: [],
        },
      ];
  return [...fromCatalog, ...extra].map((model) => ({
    ...model,
    is_default: model.id === activeModel,
    read_on: readOn,
  }));
}

export function modelIdsOf(options: {
  capability: OpenAiCapability;
  activeModel: string;
}): string[] {
  return modelsOfCapability(options).map((model) => model.id);
}

export function openAiDescription(activeModels: ActiveModels) {
  const capabilities: OpenAiCapability[] = ["image", "speech", "align"];
  return {
    label: "OpenAI",
    runs: "hosted",
    keys: [openAiKey],
    models: capabilities.flatMap((capability) =>
      modelsOfCapability({
        capability,
        activeModel: activeModels[capability],
      }),
    ),
  };
}

export function chooseModel(options: {
  capability: OpenAiCapability;
  activeModel: string;
  requested: string | undefined;
}): { ok: true; value: string } | { ok: false; failure: string } {
  const { capability, activeModel, requested } = options;
  if (requested === undefined) return { ok: true, value: activeModel };
  const ids = modelIdsOf({ capability, activeModel });
  if (ids.includes(requested)) return { ok: true, value: requested };
  return {
    ok: false,
    failure: `Unknown model "${requested}". The ${capability} models of this server are: ${ids.join(", ")}.`,
  };
}

export function estimatedCostOf(options: {
  model: string;
  minutes: number;
}): { cost_usd: number; cost_is_estimate: true } | undefined {
  const price = catalogModels
    .find((model) => model.id === options.model)
    ?.prices.find(
      (candidate) =>
        candidate.unit === "minute" && Object.keys(candidate.when).length === 0,
    );
  if (!price) return undefined;
  return { cost_usd: price.usd * options.minutes, cost_is_estimate: true };
}
