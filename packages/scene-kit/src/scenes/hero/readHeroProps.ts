import type { JsonObject } from "@yumekit/scene";
import { readField, shortenText } from "../../props/readField.js";
import { heroLimits, heroSchema } from "../../schemas/hero.js";

export function readHeroProps(props: JsonObject) {
  const { shape } = heroSchema.props;
  return {
    heading: readField({
      field: shape.heading,
      value: props["heading"],
      fallback: "Title",
      repair: shortenText(heroLimits.heading),
    }),
    accentWord: readField({
      field: shape.accentWord,
      value: props["accentWord"],
      fallback: undefined,
    }),
    kicker: readField({
      field: shape.kicker,
      value: props["kicker"],
      fallback: undefined,
      repair: shortenText(heroLimits.kicker),
    }),
  };
}
