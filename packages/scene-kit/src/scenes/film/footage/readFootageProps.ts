import type { JsonObject } from "@yumekit/scene";
import { keepValidItems, readField } from "../../../props/readField.js";
import {
  footageLimits,
  footageSchema,
  footageStop,
} from "../../../schemas/film/footage.js";
import { readFilmHeading } from "../readFilmProps.js";

export function readFootageProps(props: JsonObject) {
  const { shape } = footageSchema.props;
  return {
    ...readFilmHeading(props),
    assetId: readField({
      field: shape.assetId,
      value: props["assetId"],
      fallback: "",
    }),
    region: readField({
      field: shape.region,
      value: props["region"],
      fallback: undefined,
    }),
    mark: readField({
      field: shape.mark,
      value: props["mark"],
      fallback: undefined,
    }),
    startSeconds: readField({
      field: shape.startSeconds,
      value: props["startSeconds"],
      fallback: undefined,
    }),
    speed:
      readField({ field: shape.speed, value: props["speed"], fallback: 1 }) ??
      1,
    stops:
      readField({
        field: shape.stops,
        value: props["stops"],
        fallback: undefined,
        repair: keepValidItems({
          item: footageStop,
          maxItems: footageLimits.stops,
        }),
      }) ?? [],
    window:
      readField({
        field: shape.window,
        value: props["window"],
        fallback: "plain" as const,
      }) ?? "plain",
  };
}

export type FootageProps = ReturnType<typeof readFootageProps>;
