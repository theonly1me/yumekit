import type { JsonObject } from "@yumekit/scene";
import { readField, shortenText } from "../../props/readField.js";
import { statLimits, statSchema } from "../../schemas/stat.js";

export function readStatProps(props: JsonObject) {
  const { shape } = statSchema.props;
  return {
    value: readField({
      field: shape.value,
      value: props["value"],
      fallback: 0,
    }),
    prefix: readField({
      field: shape.prefix,
      value: props["prefix"],
      fallback: undefined,
    }),
    suffix: readField({
      field: shape.suffix,
      value: props["suffix"],
      fallback: undefined,
    }),
    label: readField({
      field: shape.label,
      value: props["label"],
      fallback: undefined,
      repair: shortenText(statLimits.label),
    }),
  };
}
