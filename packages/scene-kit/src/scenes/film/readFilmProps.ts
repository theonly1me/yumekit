import type { JsonObject } from "@yumekit/scene";
import { readField, shortenText } from "../../props/readField.js";
import {
  filmAccent,
  filmHeading,
  filmLimits,
} from "../../schemas/film/shared.js";

export function readFilmHeading(props: JsonObject) {
  return {
    heading: readField({
      field: filmHeading,
      value: props["heading"],
      fallback: undefined,
      repair: shortenText(filmLimits.heading),
    }),
    accent: readField({
      field: filmAccent,
      value: props["accent"],
      fallback: undefined,
    }),
  };
}

export function readAssetIds(options: {
  value: unknown;
  maxItems: number;
}): string[] {
  if (!Array.isArray(options.value)) return [];
  return options.value
    .filter(
      (item: unknown): item is string =>
        typeof item === "string" && item !== "",
    )
    .slice(0, options.maxItems);
}

export function readTexts(options: {
  value: unknown;
  maxItems: number;
  maxLength: number;
}): string[] {
  if (!Array.isArray(options.value)) return [];
  return options.value
    .slice(0, options.maxItems)
    .map((item: unknown) =>
      typeof item === "string" ? item.slice(0, options.maxLength) : "",
    );
}

export function readStartSecondsEach(value: unknown): (number | undefined)[] {
  if (!Array.isArray(value)) return [];
  return value.map((item: unknown) =>
    typeof item === "number" && Number.isFinite(item) && item >= 0
      ? item
      : undefined,
  );
}
