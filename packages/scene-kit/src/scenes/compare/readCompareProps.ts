import type { JsonObject } from "@yumekit/scene";
import {
  keepValidItems,
  readField,
  shortenText,
} from "../../props/readField.js";
import {
  compareLimits,
  compareRow,
  compareSchema,
} from "../../schemas/compare.js";

export function readCompareProps(props: JsonObject) {
  const { shape } = compareSchema.props;
  return {
    left: readField({
      field: shape.left,
      value: props["left"],
      fallback: "Before",
      repair: shortenText(compareLimits.title),
    }),
    right: readField({
      field: shape.right,
      value: props["right"],
      fallback: "After",
      repair: shortenText(compareLimits.title),
    }),
    rows: readField({
      field: shape.rows,
      value: props["rows"],
      fallback: [],
      repair: keepValidItems({
        item: compareRow,
        maxItems: compareLimits.rows,
      }),
    }),
  };
}
