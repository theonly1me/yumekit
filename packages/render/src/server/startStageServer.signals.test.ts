import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { renderFrame, startPreviewServer } from "../index.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { movingSquareCode } from "../testing/sceneCodes.js";
import { valueOf } from "../testing/valueOf.js";

function exitListenerCount(): number {
  return process.listenerCount("SIGTERM") + process.stdin.listenerCount("end");
}

async function squareProject(): Promise<string> {
  return createRenderProject({
    edits: [
      moduleScene({ sceneId: "square", code: movingSquareCode }),
      sceneTracks({
        tracks: [
          [{ id: "one", sceneId: "square", startFrame: 0, durationFrames: 10 }],
        ],
      }),
    ],
  });
}

describe("the stage server and the process signals", () => {
  it("adds no SIGTERM or stdin end listener while a preview server runs", async () => {
    const folder = await squareProject();
    const before = exitListenerCount();

    const preview = valueOf(
      await startPreviewServer({ projectFolder: folder }),
    );
    const during = exitListenerCount();
    await preview.close();

    expect(during).toBe(before);
    expect(exitListenerCount()).toBe(before);
  });

  it("adds no SIGTERM or stdin end listener while a render runs", async () => {
    const folder = await squareProject();
    const before = exitListenerCount();
    const counts: number[] = [];
    const progress = { isRendering: true };

    const rendering = renderFrame({ folder, outputId: "wide", frame: 3 }).then(
      (rendered) => {
        progress.isRendering = false;
        return rendered;
      },
    );
    while (progress.isRendering) {
      counts.push(exitListenerCount());
      await delay(5);
    }
    const rendered = await rendering;

    expect(rendered.ok).toBe(true);
    expect(counts.length).toBeGreaterThan(5);
    expect(new Set(counts)).toEqual(new Set([before]));
  });
});
