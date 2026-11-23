import type { JsonObject } from "@yumekit/scene";
import {
  keepValidItems,
  readField,
  shortenText,
} from "../../props/readField.js";
import { stepsItem, stepsLimits, stepsSchema } from "../../schemas/steps.js";

export function readStepsProps(props: JsonObject) {
  const { shape } = stepsSchema.props;
  return {
    heading: readField({
      field: shape.heading,
      value: props["heading"],
      fallback: undefined,
      repair: shortenText(stepsLimits.heading),
    }),
    steps: readField({
      field: shape.steps,
      value: props["steps"],
      fallback: ["Start", "Finish"],
      repair: keepValidItems({ item: stepsItem, maxItems: stepsLimits.steps }),
    }),
  };
}
