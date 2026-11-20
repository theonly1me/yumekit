import type { SceneModule } from "./guardScene.js";
import { messageOf, SceneFailure } from "./sceneFailure.js";
import type { PageSceneSource } from "./stagePageData.js";

function isSceneModule(candidate: unknown): candidate is SceneModule {
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    "mount" in candidate &&
    typeof candidate.mount === "function"
  );
}

function kitSceneOf(options: {
  kitScenes: unknown;
  component: string;
}): unknown {
  const { kitScenes, component } = options;
  if (typeof kitScenes !== "object" || kitScenes === null) {
    return undefined;
  }
  return Object.entries(kitScenes).find(([name]) => name === component)?.[1];
}

function defaultExportOf(imported: unknown): unknown {
  return typeof imported === "object" &&
    imported !== null &&
    "default" in imported
    ? imported.default
    : undefined;
}

export async function loadSceneModule(options: {
  sceneId: string;
  source: PageSceneSource | undefined;
  kitScenes: unknown;
  importModuleScene: (sceneId: string) => Promise<unknown>;
}): Promise<SceneModule> {
  const { sceneId, source, kitScenes } = options;
  let candidate: unknown;
  try {
    candidate =
      source?.kind === "module"
        ? defaultExportOf(await options.importModuleScene(sceneId))
        : kitSceneOf({ kitScenes, component: source?.component ?? "" });
  } catch (error) {
    throw new SceneFailure({
      sceneId,
      message: `Scene "${sceneId}" did not load: ${messageOf(error)}`,
      cause: error,
    });
  }
  if (!isSceneModule(candidate)) {
    const what =
      source?.kind === "kit"
        ? `The kit has no scene component "${source.component}"`
        : "The default export is not a SceneModule";
    throw new SceneFailure({
      sceneId,
      message: `${what} (scene "${sceneId}")`,
    });
  }
  return candidate;
}
