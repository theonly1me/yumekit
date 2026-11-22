import type { JsonObject } from "@yumekit/scene";
import { readField, shortenText } from "../../props/readField.js";
import {
  logoRevealLimits,
  logoRevealSchema,
} from "../../schemas/logoReveal.js";

export function readLogoRevealProps(props: JsonObject) {
  const { shape } = logoRevealSchema.props;
  return {
    name: readField({
      field: shape.name,
      value: props["name"],
      fallback: "Name",
      repair: shortenText(logoRevealLimits.name),
    }),
    assetId: readField({
      field: shape.assetId,
      value: props["assetId"],
      fallback: undefined,
    }),
    tagline: readField({
      field: shape.tagline,
      value: props["tagline"],
      fallback: undefined,
      repair: shortenText(logoRevealLimits.tagline),
    }),
  };
}
