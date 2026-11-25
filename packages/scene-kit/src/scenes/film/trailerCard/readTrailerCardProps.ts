import type { JsonObject } from "@yumekit/scene";
import { keepValidItems, readField } from "../../../props/readField.js";
import {
  trailerCardLimits,
  trailerCardLine,
  trailerCardSchema,
} from "../../../schemas/film/trailerCard.js";

const defaultTracking = { card: 0.28, title: 0.14 } as const;

export function readTrailerCardProps(props: JsonObject) {
  const { shape } = trailerCardSchema.props;
  const variant =
    readField({
      field: shape.variant,
      value: props["variant"],
      fallback: undefined,
    }) ?? "card";
  return {
    lines: readField({
      field: shape.lines,
      value: props["lines"],
      fallback: ["Title"],
      repair: keepValidItems({
        item: trailerCardLine,
        maxItems: trailerCardLimits.lines,
      }),
    }),
    variant,
    face:
      readField({
        field: shape.face,
        value: props["face"],
        fallback: undefined,
      }) ?? "display",
    scale:
      readField({
        field: shape.scale,
        value: props["scale"],
        fallback: undefined,
      }) ?? 1,
    tracking:
      readField({
        field: shape.tracking,
        value: props["tracking"],
        fallback: undefined,
      }) ?? defaultTracking[variant],
    capitals:
      readField({
        field: shape.capitals,
        value: props["capitals"],
        fallback: undefined,
      }) ?? true,
    color: readField({
      field: shape.color,
      value: props["color"],
      fallback: undefined,
    }),
    background:
      readField({
        field: shape.background,
        value: props["background"],
        fallback: undefined,
      }) ?? "black",
    backgroundAssetId:
      readField({
        field: shape.backgroundAssetId,
        value: props["backgroundAssetId"],
        fallback: undefined,
      }) ?? "",
    landsOnBeat:
      readField({
        field: shape.landsOnBeat,
        value: props["landsOnBeat"],
        fallback: undefined,
      }) ?? 0,
    holdSeconds: readField({
      field: shape.holdSeconds,
      value: props["holdSeconds"],
      fallback: undefined,
    }),
    flash:
      readField({
        field: shape.flash,
        value: props["flash"],
        fallback: undefined,
      }) ?? false,
  };
}

export type TrailerCardProps = ReturnType<typeof readTrailerCardProps>;
