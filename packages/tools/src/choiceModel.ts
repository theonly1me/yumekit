import type { ChoiceModel } from "./choiceTypes.js";
import type { MediaModel } from "./description.js";
import { priceAtDefaultsOf } from "./spending/catalogPrice.js";

function defaultResolutionOf(model: MediaModel): string | undefined {
  const setting = model.settings.find(
    (candidate) => candidate.name === "resolution",
  );
  return setting?.kind === "choice" ? setting.default : undefined;
}

export function choiceModelOf(model: MediaModel): ChoiceModel {
  const price = priceAtDefaultsOf(model);
  const resolution = defaultResolutionOf(model);
  return {
    id: model.id,
    label: model.label,
    isDefault: model.is_default,
    ...(model.download === undefined ? {} : { download: model.download }),
    ...(model.tested === undefined ? {} : { tested: model.tested }),
    ...(price === undefined
      ? {}
      : { priceAtDefaults: { usd: price.usd, unit: price.unit } }),
    ...(resolution === undefined ? {} : { defaultResolution: resolution }),
  };
}
