import type { JsonObject } from "@yumekit/scene";
import { keepValidItems, readField } from "../../props/readField.js";
import {
  kineticLimits,
  kineticLine,
  kineticSchema,
} from "../../schemas/kinetic.js";

export function readKineticProps(props: JsonObject) {
  const { shape } = kineticSchema.props;
  return {
    lines: readField({
      field: shape.lines,
      value: props["lines"],
      fallback: ["Line"],
      repair: keepValidItems({
        item: kineticLine,
        maxItems: kineticLimits.lines,
      }),
    }),
    assetId: readField({
      field: shape.assetId,
      value: props["assetId"],
      fallback: undefined,
    }),
  };
}
