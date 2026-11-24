import type { JsonObject, MediaModel } from "@yumekit/tools";

const sizeSettingName = "resolution";

function nextSizeTextOf(options: {
  model: MediaModel | undefined;
  input: JsonObject;
}): string {
  const setting = options.model?.settings.find(
    (candidate) => candidate.name === sizeSettingName,
  );
  if (setting?.kind !== "choice") {
    return "The model makes its own sizes, so place the picture with its real size.";
  }
  const asked = options.input[sizeSettingName];
  const current = typeof asked === "string" ? asked : setting.default;
  const next = setting.choices[setting.choices.indexOf(current) + 1];
  return next === undefined
    ? `This is the largest size of the model (input.${sizeSettingName} "${current}").`
    : `For a larger picture, ask again with input.${sizeSettingName} "${next}".`;
}

export function sizeNoteOf(options: {
  input: JsonObject;
  widthPixels: number | undefined;
  heightPixels: number | undefined;
  model: MediaModel | undefined;
}): string | undefined {
  const { input, widthPixels, heightPixels } = options;
  const askedWidth = input["width_pixels"];
  const askedHeight = input["height_pixels"];
  if (
    typeof askedWidth !== "number" ||
    typeof askedHeight !== "number" ||
    widthPixels === undefined ||
    heightPixels === undefined
  ) {
    return undefined;
  }
  if (askedWidth === widthPixels && askedHeight === heightPixels) {
    return undefined;
  }
  return `The picture is ${String(widthPixels)} by ${String(heightPixels)} pixels, not the asked ${String(askedWidth)} by ${String(askedHeight)}. ${nextSizeTextOf(options)}`;
}
