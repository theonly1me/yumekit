import type { Timeline } from "@yumekit/project";
import type { StagePage } from "../browser/openStagePage.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { FrameRange } from "../project/frameRange.js";
import { sceneIdsAt } from "../project/sceneIdsAt.js";
import type { RenderFailure } from "../renderFailure.js";
import { pngSizeOf, type PictureSize } from "../png.js";
import { drawFrame } from "./drawFrame.js";

function haveSameBytes(pictures: {
  first: Uint8Array | undefined;
  second: Uint8Array | undefined;
}): boolean {
  const { first, second } = pictures;
  return (
    first !== undefined &&
    second !== undefined &&
    Buffer.from(first).equals(second)
  );
}

export async function checkRepeatable(options: {
  stagePage: StagePage;
  range: FrameRange;
  timeline: Timeline;
}): Promise<Outcome<PictureSize, RenderFailure>> {
  const { stagePage, range, timeline } = options;
  const firstFrame = range.firstFrame;
  const middleFrame = range.firstFrame + Math.floor(range.frameCount / 2);
  const pictures: Uint8Array[] = [];
  for (const frame of [firstFrame, middleFrame, middleFrame, firstFrame]) {
    const drawn = await drawFrame({ stagePage, frame, use: "still" });
    if (!drawn.ok) {
      return drawn;
    }
    pictures.push(drawn.value);
  }
  const [firstPicture, middlePicture, middleAgain, firstAgain] = pictures;
  const pairs = [
    { frame: firstFrame, first: firstPicture, second: firstAgain },
    { frame: middleFrame, first: middlePicture, second: middleAgain },
  ];
  const differing = pairs.find((pair) => !haveSameBytes(pair));
  if (differing === undefined && firstPicture !== undefined) {
    return succeed(pngSizeOf(firstPicture));
  }
  if (differing === undefined) {
    throw new Error("The repeat check drew no picture");
  }
  const sceneIds = sceneIdsAt({ timeline, frame: differing.frame });
  return fail({
    kind: "scene-not-repeatable",
    sceneIds,
    frame: differing.frame,
    message: `Frame ${String(differing.frame)} gave two different pictures. Scenes ${sceneIds.join(", ")} must draw from the frame number only: no clock, no unseeded random value, and no state from an earlier seek.`,
  });
}
