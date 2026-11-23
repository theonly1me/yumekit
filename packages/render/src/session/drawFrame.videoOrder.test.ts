import { describe, expect, it } from "vitest";
import { loadOutput } from "../project/loadOutput.js";
import { movingMarkerVideo } from "../testing/testVideo.js";
import { valueOf } from "../testing/valueOf.js";
import {
  createVideoProject,
  markerCenterInPng,
} from "../testing/videoProject.js";
import { drawFrame } from "./drawFrame.js";
import { withStagePage } from "./withStagePage.js";

describe("frames of a video asset in any order", () => {
  it("gives the same picture for frame 10 before and after frame 3", async () => {
    const folder = await createVideoProject({
      video: movingMarkerVideo,
      clipFrames: 60,
    });
    const loaded = valueOf(await loadOutput({ folder, outputId: "wide" }));

    const pictures = valueOf(
      await withStagePage({
        loaded,
        scale: 1,
        use: async (stagePage) => {
          const drawn: Uint8Array[] = [];
          for (const frame of [10, 3, 10]) {
            drawn.push(
              valueOf(await drawFrame({ stagePage, frame, use: "still" })),
            );
          }
          return { ok: true, value: drawn };
        },
      }),
    );

    const [firstTen, three, secondTen] = pictures;
    if (
      firstTen === undefined ||
      three === undefined ||
      secondTen === undefined
    ) {
      throw new Error("Expected three pictures");
    }
    expect(Buffer.from(secondTen).equals(firstTen)).toBe(true);
    expect(Buffer.from(three).equals(firstTen)).toBe(false);
    const sourceFrameOfTen = Math.floor((10 * 24) / 30);
    const center = await markerCenterInPng({ png: firstTen });
    expect(Math.abs(center - (sourceFrameOfTen * 6 + 1.5))).toBeLessThan(2);
  });
});
