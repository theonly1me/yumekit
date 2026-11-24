import type { MediaModel, MediaTools } from "@yumekit/tools";
import type { GenerateAssetInput } from "./generateAssetInput.js";

export interface StrongChoice {
  request: GenerateAssetInput;
  note: string | undefined;
}

type StrongCapability = "image" | "video";

const unitOf = { image: "image", video: "second" } as const;

function basePriceOf(options: {
  model: MediaModel;
  capability: StrongCapability;
}): number | undefined {
  const prices = options.model.prices
    .filter((price) => price.unit === unitOf[options.capability])
    .map((price) => price.usd);
  return prices.length === 0 ? undefined : Math.min(...prices);
}

function acceptsCall(options: {
  model: MediaModel;
  request: GenerateAssetInput;
}): boolean {
  const { model, request } = options;
  const accepts = model.accepts ?? [];
  const needsReferences = (request.reference_asset_ids ?? []).length > 0;
  const needsFirst = request.first_frame_asset_id !== undefined;
  return (
    (!needsReferences || accepts.includes("reference_images")) &&
    (!needsFirst || accepts.includes("first_frame"))
  );
}

function usd(value: number): string {
  return String(Math.round(value * 10000) / 10000);
}

export async function withStrongModel(options: {
  request: GenerateAssetInput;
  mediaTools: MediaTools;
  why: string;
}): Promise<StrongChoice> {
  const { request, mediaTools } = options;
  const unchanged = { request, note: undefined };
  const { capability } = request;
  if (request.model !== undefined) return unchanged;
  if (capability !== "image" && capability !== "video") return unchanged;
  const choice = (await mediaTools.choices()).choices.find(
    (candidate) => candidate.capability === capability,
  );
  const current = choice?.current;
  const server = request.server ?? current?.server;
  const models = (
    mediaTools.list().find((entry) => entry.server === server)?.description
      ?.models ?? []
  ).filter((model) => model.capability === capability);
  const pickedModel =
    current?.source === "picked" &&
    current.model !== undefined &&
    models.some((model) => model.id === current.model && !model.is_default);
  if (pickedModel) return unchanged;
  const priced = models.flatMap((model) => {
    const price = basePriceOf({ model, capability });
    return price === undefined || !acceptsCall({ model, request })
      ? []
      : [{ model, price }];
  });
  const fallback = priced.find((entry) => entry.model.is_default);
  const strongest = priced.reduce<(typeof priced)[number] | undefined>(
    (...[best, entry]) =>
      best === undefined || entry.price > best.price ? entry : best,
    fallback,
  );
  if (strongest === undefined || strongest.model.is_default) return unchanged;
  const defaultText =
    fallback === undefined
      ? ""
      : `; the default ${fallback.model.label} costs ${usd(fallback.price)}`;
  const unit = capability === "image" ? "a picture" : "a second";
  return {
    request: { ...request, model: strongest.model.id },
    note: `Made with ${strongest.model.label}, the strongest ${capability === "image" ? "picture" : "video"} model of ${server ?? "the service"}, at ${usd(strongest.price)} US dollars ${unit}${defaultText}, because ${options.why}.`,
  };
}
