import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { createPictureRenderer } from "../index.js";
import { browserProcessIds } from "../testing/browserProcesses.js";
import { solidColorCode } from "../testing/sceneCodes.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { valueOf } from "../testing/valueOf.js";

function colorProject() {
  return createRenderProject({
    edits: [
      moduleScene({ sceneId: "color", code: solidColorCode }),
      sceneTracks({
        tracks: [
          [
            {
              id: "color",
              sceneId: "color",
              startFrame: 0,
              durationFrames: 10,
            },
          ],
        ],
      }),
    ],
  });
}

async function waitForNoBrowser(): Promise<number[]> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const processIds = await browserProcessIds();
    if (processIds.length === 0) return processIds;
    await delay(100);
  }
  return browserProcessIds();
}

describe("the life of the kept browser", () => {
  it("starts with the first picture and keeps one browser for later pictures", async () => {
    const pictures = createPictureRenderer({ folder: await colorProject() });
    const beforeFirst = await browserProcessIds();
    valueOf(await pictures.renderFrames({ outputId: "wide", frames: [1] }));
    const afterFirst = await browserProcessIds();
    valueOf(await pictures.renderFrames({ outputId: "wide", frames: [2] }));
    const afterSecond = await browserProcessIds();
    await pictures.close();

    expect(beforeFirst).toEqual([]);
    expect(afterFirst).toHaveLength(1);
    expect(afterSecond).toEqual(afterFirst);
  });

  it("closes the browser after the idle time with no picture", async () => {
    const pictures = createPictureRenderer({
      folder: await colorProject(),
      idleMilliseconds: 300,
    });
    valueOf(await pictures.renderFrames({ outputId: "wide", frames: [1] }));
    const whileKept = await browserProcessIds();
    const afterIdle = await waitForNoBrowser();
    valueOf(await pictures.renderFrames({ outputId: "wide", frames: [1] }));
    const afterNextPicture = await browserProcessIds();
    await pictures.close();

    expect(whileKept).toHaveLength(1);
    expect(afterIdle).toEqual([]);
    expect(afterNextPicture).toHaveLength(1);
  });

  it("closes the browser when it closes", async () => {
    const pictures = createPictureRenderer({ folder: await colorProject() });
    valueOf(await pictures.renderFrames({ outputId: "wide", frames: [1] }));

    await pictures.close();

    expect(await browserProcessIds()).toEqual([]);
  });

  it("starts one new browser when the kept browser died", async () => {
    const pictures = createPictureRenderer({ folder: await colorProject() });
    valueOf(await pictures.renderFrames({ outputId: "wide", frames: [1] }));
    const [died] = await browserProcessIds();
    if (died === undefined) throw new Error("No browser runs");
    process.kill(died, "SIGKILL");
    await waitForNoBrowser();

    const afterDeath = await pictures.renderFrames({
      outputId: "wide",
      frames: [1],
    });
    const restarted = await browserProcessIds();
    await pictures.close();

    expect(afterDeath.ok).toBe(true);
    expect(restarted).toHaveLength(1);
    expect(restarted).not.toContain(died);
  });
});
