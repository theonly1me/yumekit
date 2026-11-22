import type { JsonObject } from "@yumekit/scene";
import {
  keepValidItems,
  readField,
  shortenText,
} from "../../props/readField.js";
import {
  checklistItem,
  checklistLimits,
  checklistSchema,
} from "../../schemas/checklist.js";

export function readChecklistProps(props: JsonObject) {
  const { shape } = checklistSchema.props;
  return {
    heading: readField({
      field: shape.heading,
      value: props["heading"],
      fallback: undefined,
      repair: shortenText(checklistLimits.heading),
    }),
    items: readField({
      field: shape.items,
      value: props["items"],
      fallback: ["Point"],
      repair: keepValidItems({
        item: checklistItem,
        maxItems: checklistLimits.items,
      }),
    }),
  };
}
