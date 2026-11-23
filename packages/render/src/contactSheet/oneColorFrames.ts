import type { StagePage } from "../browser/openStagePage.js";
import { succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { drawFrame } from "../session/drawFrame.js";
import type { StageHost } from "../session/stageHost.js";

const entrySeconds = 0.3;

export async function oneColorFramesOf(options: {
  host: StageHost;
  stagePage: StagePage;
  pictures: { frame: number; png: Uint8Array }[];
  frameCount: number;
  framesPerSecond: number;
}): Promise<Outcome<(string | undefined)[], RenderFailure>> {
  const { host, stagePage, pictures } = options;
  const colors = await host.oneColorsOf(pictures.map((picture) => picture.png));
  const laterFrames = pictures.map((picture) =>
    Math.min(
      options.frameCount - 1,
      picture.frame + Math.round(entrySeconds * options.framesPerSecond),
    ),
  );
  const toConfirm = pictures.flatMap((...[picture, index]) => {
    const later = laterFrames[index] ?? picture.frame;
    return colors[index] !== null && later > picture.frame ? [index] : [];
  });
  const laterPngs: Uint8Array[] = [];
  for (const index of toConfirm) {
    const drawn = await drawFrame({
      stagePage,
      frame: laterFrames[index] ?? 0,
      use: "video",
    });
    if (!drawn.ok) return drawn;
    laterPngs.push(drawn.value);
  }
  const laterColors = await host.oneColorsOf(laterPngs);
  return succeed(
    colors.map((...[color, index]) => {
      const confirmIndex = toConfirm.indexOf(index);
      const stays = confirmIndex === -1 || laterColors[confirmIndex] !== null;
      return color !== null && stays ? color : undefined;
    }),
  );
}
