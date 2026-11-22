import {
  inCatalogOrder,
  platformOf,
  type Output,
  type PlatformId,
} from "@yumekit/project";

export function outputsForPlatforms(platformIds: PlatformId[]): Output[] {
  const outputs: Output[] = [];
  for (const platform of inCatalogOrder(platformIds).map(platformOf)) {
    const sameSize = outputs.find(
      (output) =>
        output.widthPixels === platform.widthPixels &&
        output.heightPixels === platform.heightPixels,
    );
    if (sameSize === undefined) {
      outputs.push({
        id: platform.outputId,
        label: platform.outputLabel,
        widthPixels: platform.widthPixels,
        heightPixels: platform.heightPixels,
        platforms: [platform.id],
      });
    } else {
      sameSize.platforms = [...(sameSize.platforms ?? []), platform.id];
    }
  }
  return outputs;
}
