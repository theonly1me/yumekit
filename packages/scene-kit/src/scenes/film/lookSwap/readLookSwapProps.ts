import type { JsonObject } from "@yumekit/scene";
import { readField } from "../../../props/readField.js";
import {
  lookSwapLimits,
  lookSwapSchema,
} from "../../../schemas/film/lookSwap.js";
import { filmLimits } from "../../../schemas/film/shared.js";
import { readAssetIds, readFilmHeading, readTexts } from "../readFilmProps.js";

export function readLookSwapProps(props: JsonObject) {
  const { shape } = lookSwapSchema.props;
  return {
    ...readFilmHeading(props),
    assetIds: readAssetIds({
      value: props["assetIds"],
      maxItems: lookSwapLimits.assets,
    }),
    labels: readTexts({
      value: props["labels"],
      maxItems: lookSwapLimits.assets,
      maxLength: filmLimits.label,
    }),
    marks: readTexts({
      value: props["marks"],
      maxItems: lookSwapLimits.assets,
      maxLength: filmLimits.markName,
    }),
    region: readField({
      field: shape.region,
      value: props["region"],
      fallback: undefined,
    }),
    beatsEach:
      readField({
        field: shape.beatsEach,
        value: props["beatsEach"],
        fallback: undefined,
      }) ?? 1,
  };
}
