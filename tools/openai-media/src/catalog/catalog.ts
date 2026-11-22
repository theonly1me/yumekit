import { alignEntries } from "./alignModels.ts";
import type {
  CatalogEntry,
  CatalogModel,
  OpenAiCapability,
} from "./catalogModel.ts";
import { imageEntries } from "./imageModels.ts";
import { speechEntries } from "./speechModels.ts";

export type { OpenAiCapability } from "./catalogModel.ts";

const readOn = "2026-11-22";

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

export const catalogEntries: CatalogEntry[] = [
  ...imageEntries,
  ...speechEntries,
  ...alignEntries,
];

export const catalogModels: CatalogModel[] = catalogEntries.map(
  (entry) => entry.model,
);

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
