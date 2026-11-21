import { loadStylePackFonts, paper } from "@yumekit/scene-kit";
import stagePageData, { moduleSceneImports } from "virtual:yumekit-stage-data";
import { createPageStage } from "./pageStage.js";
import { createSceneErrorLog } from "./sceneErrorLog.js";
import type { StagePageApi } from "./stagePageData.js";

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
  const stage = createPageStage({
    element,
    pageData: stagePageData,
    importModuleScene,
    errorLog: createSceneErrorLog(),
    mode: "render",
  });
  return { seek: stage.seek };
}

await loadStylePackFonts(paper);
window.yumekitStage = startStagePage();
