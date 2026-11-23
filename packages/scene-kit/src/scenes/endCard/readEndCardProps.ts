import type { JsonObject } from "@yumekit/scene";
import { readField, shortenText } from "../../props/readField.js";
import { endCardLimits, endCardSchema } from "../../schemas/endCard.js";

export function readEndCardProps(props: JsonObject) {
  const { shape } = endCardSchema.props;
  return {
    heading: readField({
      field: shape.heading,
      value: props["heading"],
      fallback: "Title",
      repair: shortenText(endCardLimits.heading),
    }),
    action: readField({
      field: shape.action,
      value: props["action"],
      fallback: undefined,
      repair: shortenText(endCardLimits.action),
    }),
    handle: readField({
      field: shape.handle,
      value: props["handle"],
      fallback: undefined,
      repair: shortenText(endCardLimits.handle),
    }),
  };
}
