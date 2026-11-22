import { platformCatalog, type Platform } from "@yumekit/project/platforms";
import type { Output } from "../engine/snapshot.js";
import { outputLabel } from "../timeline/timelineFacts.js";

export interface PlatformTab {
  key: string;
  name: string;
  shape: string;
  output: Output;
  platformId: string | undefined;
}

const largestShapePart = 32;

function greatestDivisor(options: { first: number; second: number }): number {
  const { first, second } = options;
  return second === 0
    ? first
    : greatestDivisor({ first: second, second: first % second });
}

export function shapeOf(output: Output): string {
  const divisor = greatestDivisor({
    first: output.widthPixels,
    second: output.heightPixels,
  });
  const width = output.widthPixels / divisor;
  const height = output.heightPixels / divisor;
  return width <= largestShapePart && height <= largestShapePart
    ? `${String(width)}:${String(height)}`
    : `${String(output.widthPixels)} x ${String(output.heightPixels)}`;
}

export function hasPlatforms(output: Output): boolean {
  return (output.platforms ?? []).length > 0;
}

export function platformTabsOf(outputs: Output[]): PlatformTab[] {
  const platformTabs = platformCatalog.flatMap((platform) => {
    const output = outputs.find((candidate) =>
      (candidate.platforms ?? []).includes(platform.id),
    );
    return output === undefined
      ? []
      : [
          {
            key: `platform:${platform.id}`,
            name: platform.name,
            shape: platform.shape,
            output,
            platformId: platform.id,
          },
        ];
  });
  const outputTabs = outputs
    .filter((output) => !hasPlatforms(output))
    .map((output) => ({
      key: `output:${output.id}`,
      name: outputLabel(output),
      shape: shapeOf(output),
      output,
      platformId: undefined,
    }));
  return [...platformTabs, ...outputTabs];
}

export function platformsOff(outputs: Output[]): Platform[] {
  return platformCatalog.filter(
    (platform) =>
      !outputs.some((output) => (output.platforms ?? []).includes(platform.id)),
  );
}

export function platformsOn(outputs: Output[]): Platform[] {
  return platformCatalog.filter((platform) =>
    outputs.some((output) => (output.platforms ?? []).includes(platform.id)),
  );
}
