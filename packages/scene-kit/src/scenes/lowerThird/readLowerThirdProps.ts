import type { JsonObject } from "@yumekit/scene";
import { readField, shortenText } from "../../props/readField.js";
import {
  lowerThirdLimits,
  lowerThirdSchema,
} from "../../schemas/lowerThird.js";

export function readLowerThirdProps(props: JsonObject) {
  const { shape } = lowerThirdSchema.props;
  return {
    name: readField({
      field: shape.name,
      value: props["name"],
      fallback: "Name",
      repair: shortenText(lowerThirdLimits.name),
    }),
    role: readField({
      field: shape.role,
      value: props["role"],
      fallback: undefined,
      repair: shortenText(lowerThirdLimits.role),
    }),
  };
}
