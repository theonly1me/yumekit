import { describe, expect, it } from "vitest";
import type { SceneModule } from "./guardScene.js";
import { loadSceneModule } from "./loadSceneModule.js";

const titleCard: SceneModule = {
  mount: () =>
    Promise.resolve({
      seek: () => Promise.resolve(),
      dispose: () => undefined,
    }),
};

const kitScenes = { "title-card": titleCard };

function importModuleScene(sceneId: string): Promise<unknown> {
  return Promise.reject(new Error(`Failed to fetch ${sceneId}`));
}

describe("loadSceneModule", () => {
  it("finds a kit scene by its component name in kitScenes", async () => {
    await expect(
      loadSceneModule({
        sceneId: "intro",
        source: { kind: "kit", component: "title-card" },
        kitScenes,
        importModuleScene,
      }),
    ).resolves.toBe(titleCard);
  });

  it("names the scene when the kit has no such component", async () => {
    const loaded = loadSceneModule({
      sceneId: "intro",
      source: { kind: "kit", component: "bar-chart" },
      kitScenes,
      importModuleScene,
    });
    await expect(loaded).rejects.toThrow('no scene component "bar-chart"');
    await expect(loaded).rejects.toMatchObject({
      sceneId: "intro",
      component: "bar-chart",
    });
  });

  it("names the scene when a module scene does not load", async () => {
    const loaded = loadSceneModule({
      sceneId: "custom",
      source: { kind: "module", file: "/missing/scene.tsx" },
      kitScenes,
      importModuleScene,
    });
    await expect(loaded).rejects.toThrow("did not load");
    await expect(loaded).rejects.toMatchObject({ sceneId: "custom" });
  });
});
