import * as sceneKit from "@yumekit/scene-kit";
import { createStage } from "@yumekit/stage";
import stagePageData, { moduleSceneImports } from "virtual:yumekit-stage-data";
import { guardScene } from "./guardScene.js";
import { loadSceneModule } from "./loadSceneModule.js";
import { createSceneErrorLog } from "./sceneErrorLog.js";
import { messageOf, SceneFailure } from "./sceneFailure.js";
import type { SeekResult, StagePageApi } from "./stagePageData.js";

const sceneTimeoutMilliseconds = 30_000;

const kitScenes: unknown =
  "kitScenes" in sceneKit ? sceneKit.kitScenes : undefined;

const sceneImports = new Map(Object.entries(moduleSceneImports));

async function importModuleScene(sceneId: string): Promise<unknown> {
  const importScene = sceneImports.get(sceneId);
  if (importScene === undefined) {
    throw new Error(`The stage page has no code for scene "${sceneId}"`);
  }
  return importScene();
}

function startStagePage(): StagePageApi {
  const element = document.querySelector<HTMLElement>("#stage");
  if (element === null) {
    throw new Error("The stage page has no #stage element");
  }
  const sources = new Map(Object.entries(stagePageData.sceneSources));
  const errorLog = createSceneErrorLog();
  let sceneIdsSeeked: string[] = [];
  const stage = createStage({
    element,
    project: stagePageData.project,
    mode: "render",
    loadScene: async (sceneId) =>
      guardScene({
        sceneId,
        sceneModule: await loadSceneModule({
          sceneId,
          source: sources.get(sceneId),
          kitScenes,
          importModuleScene,
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
        return {
          ok: false,
          sceneId:
            error instanceof SceneFailure
              ? error.sceneId
              : (sceneIdsSeeked[0] ?? ""),
          message: messageOf(error),
        };
      }
      const [logged] = errorLog.takeErrors();
      if (logged !== undefined) {
        return {
          ok: false,
          sceneId: logged.sceneId ?? sceneIdsSeeked[0] ?? "",
          message: `A scene logged an error: ${logged.message}`,
        };
      }
      return { ok: true };
    },
  };
}

window.yumekitStage = startStagePage();
