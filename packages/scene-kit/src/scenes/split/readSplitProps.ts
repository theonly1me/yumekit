import type { JsonObject } from "@yumekit/scene";
import { readField, shortenText } from "../../props/readField.js";
import { splitLimits, splitSchema } from "../../schemas/split.js";

export function readSplitProps(props: JsonObject) {
  const { shape } = splitSchema.props;
  return {
    assetId: readField({
      field: shape.assetId,
      value: props["assetId"],
      fallback: "",
    }),
    heading: readField({
      field: shape.heading,
      value: props["heading"],
      fallback: "Title",
      repair: shortenText(splitLimits.heading),
    }),
    body: readField({
      field: shape.body,
      value: props["body"],
      fallback: undefined,
      repair: shortenText(splitLimits.body),
    }),
    side: readField({
      field: shape.side,
      value: props["side"],
      fallback: undefined,
    }),
  };
}
