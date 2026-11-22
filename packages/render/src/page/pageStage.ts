import { activateLook, kitScenesOf } from "@yumekit/scene-kit";
import { createStage, type StageOptions } from "@yumekit/stage";
import { guardScene } from "./guardScene.js";
import { loadSceneModule } from "./loadSceneModule.js";
import type { SceneErrorLog } from "./sceneErrorLog.js";
import { KitSceneNotFound, messageOf, SceneFailure } from "./sceneFailure.js";
import type { SeekResult, StagePageData } from "./stagePageData.js";

const sceneTimeoutMilliseconds = 30_000;

function kitScenesOfPage(look: string): unknown {
  activateLook(look);
  return kitScenesOf(look);
}

export interface PageStage {
  seek: (frame: number) => Promise<SeekResult>;
  dispose: () => void;
}

function failureOf(options: {
  error: unknown;
  sceneIdsSeeked: string[];
}): SeekResult {
  const { error, sceneIdsSeeked } = options;
  if (error instanceof KitSceneNotFound) {
    return {
      ok: false,
      kind: "kit-scene-not-found",
      sceneId: error.sceneId,
      component: error.component,
      message: error.message,
    };
  }
  return {
    ok: false,
    kind: "scene-error",
    sceneId:
      error instanceof SceneFailure ? error.sceneId : (sceneIdsSeeked[0] ?? ""),
    message: messageOf(error),
  };
}

export function createPageStage(options: {
  element: HTMLElement;
  pageData: StagePageData;
  importModuleScene: (sceneId: string) => Promise<unknown>;
  errorLog: SceneErrorLog;
  mode: StageOptions["mode"];
}): PageStage {
  const { pageData, errorLog } = options;
  const sources = new Map(Object.entries(pageData.sceneSources));
  const kitScenes = kitScenesOfPage(pageData.look);
  let sceneIdsSeeked: string[] = [];
  const stage = createStage({
    element: options.element,
    project: pageData.project,
    mode: options.mode,
    loadScene: async (sceneId) =>
      guardScene({
        sceneId,
        sceneModule: await loadSceneModule({
          sceneId,
          source: sources.get(sceneId),
          kitScenes,
          importModuleScene: options.importModuleScene,
        }),
        errorLog,
        timeoutMilliseconds: sceneTimeoutMilliseconds,
        onSeek: (seekedSceneId) => {
          sceneIdsSeeked.push(seekedSceneId);
        },
      }),
  });
  return {
    seek: async (frame): Promise<SeekResult> => {
      sceneIdsSeeked = [];
      try {
        await stage.seek(frame);
      } catch (error) {
        return failureOf({ error, sceneIdsSeeked });
      }
      const [logged] = errorLog.takeErrors();
      if (logged !== undefined) {
        return {
          ok: false,
          kind: "scene-error",
          sceneId: logged.sceneId ?? sceneIdsSeeked[0] ?? "",
          message: `A scene logged an error: ${logged.message}`,
        };
      }
      return { ok: true };
    },
    dispose: stage.dispose,
  };
}
