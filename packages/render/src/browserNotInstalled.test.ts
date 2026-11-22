import { describe, expect, it, onTestFinished, vi } from "vitest";
import { temporaryFolder } from "./testing/renderProject.js";
import { failureOf } from "./testing/valueOf.js";

describe("render without Chromium", () => {
  it("returns browser-not-installed with the install command", async () => {
    vi.stubEnv("PLAYWRIGHT_BROWSERS_PATH", await temporaryFolder());
    onTestFinished(() => {
      vi.unstubAllEnvs();
    });
    const { renderFrame } = await import("./index.js");
    const { createRenderProject, moduleScene, sceneTracks } =
      await import("./testing/renderProject.js");
    const { solidColorCode } = await import("./testing/sceneCodes.js");
    const folder = await createRenderProject({
      edits: [
        moduleScene({ sceneId: "solid", code: solidColorCode }),
        sceneTracks({
          tracks: [
            [
              {
                id: "show",
                sceneId: "solid",
                startFrame: 0,
                durationFrames: 5,
              },
            ],
          ],
        }),
      ],
    });
    const failure = failureOf(
      await renderFrame({ folder, outputId: "wide", frame: 0 }),
    );
    expect(failure.kind).toBe("browser-not-installed");
    expect(failure.hint).toBe("Run: yumekit setup");
  });
});
