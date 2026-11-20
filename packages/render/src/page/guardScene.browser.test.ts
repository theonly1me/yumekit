import { describe, expect, it } from "vitest";
import { guardScene, type SceneModule } from "./guardScene.js";
import { createSceneErrorLog } from "./sceneErrorLog.js";

function sceneWithSeek(seek: () => Promise<void>): SceneModule {
  return {
    mount: () => Promise.resolve({ seek, dispose: () => undefined }),
  };
}

async function mountGuarded(options: {
  sceneModule: SceneModule;
  timeoutMilliseconds: number;
}) {
  const errorLog = createSceneErrorLog();
  const guarded = guardScene({
    sceneId: "slow",
    sceneModule: options.sceneModule,
    errorLog,
    timeoutMilliseconds: options.timeoutMilliseconds,
    onSeek: () => undefined,
  });
  const mounted = await guarded.mount({
    element: document.createElement("div"),
    output: { id: "wide", widthPixels: 16, heightPixels: 16 },
    framesPerSecond: 30,
    durationFrames: 10,
    props: {},
    findAsset: () => undefined,
  });
  return { mounted, errorLog };
}

describe("guardScene", () => {
  it("rejects a seek that takes longer than the time limit and names the scene", async () => {
    const { mounted } = await mountGuarded({
      sceneModule: sceneWithSeek(() => new Promise<void>(() => undefined)),
      timeoutMilliseconds: 50,
    });
    const seek = mounted.seek(0);
    await expect(seek).rejects.toThrow("took more than 0.05 seconds");
    await expect(seek).rejects.toMatchObject({ sceneId: "slow" });
  });

  it("names the scene that throws during a seek", async () => {
    const { mounted } = await mountGuarded({
      sceneModule: sceneWithSeek(() => Promise.reject(new Error("bad frame"))),
      timeoutMilliseconds: 1000,
    });
    await expect(mounted.seek(1)).rejects.toMatchObject({
      sceneId: "slow",
      message: "bad frame",
    });
  });

  it("records an error that the scene logs during its seek", async () => {
    const { mounted, errorLog } = await mountGuarded({
      sceneModule: sceneWithSeek(() => {
        console.error("missing data");
        return Promise.resolve();
      }),
      timeoutMilliseconds: 1000,
    });
    await mounted.seek(2);
    expect(errorLog.takeErrors()).toEqual([
      { sceneId: "slow", message: "missing data" },
    ]);
    expect(errorLog.takeErrors()).toEqual([]);
  });
});
