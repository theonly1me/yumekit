import { loadPageFonts } from "./loadPageFonts.js";
import { createPageStage, type PageStage } from "./pageStage.js";
import { createSceneErrorLog } from "./sceneErrorLog.js";
import { frameFindingsOf } from "./frameFindings.js";
import {
  isStagePageLoad,
  type SeekResult,
  type StagePageApi,
  type StagePageData,
} from "./stagePageData.js";

const notLoaded: SeekResult = {
  ok: false,
  kind: "scene-error",
  sceneId: "",
  message: "The stage page has no project",
};

function startStagePage(): StagePageApi {
  const element = document.querySelector<HTMLElement>("#stage");
  if (element === null) {
    throw new Error("The stage page has no #stage element");
  }
  const errorLog = createSceneErrorLog();
  let stage: PageStage | undefined;
  let project: StagePageData["project"] | undefined;
  return {
    load: async (pageLoadText) => {
      const pageLoad: unknown = JSON.parse(pageLoadText);
      if (!isStagePageLoad(pageLoad)) {
        throw new Error("The stage page got project data that is not valid");
      }
      const { pageData, moduleSceneUrls } = pageLoad;
      project = pageData.project;
      const previous = stage;
      stage = undefined;
      try {
        previous?.dispose();
      } catch {
        element.replaceChildren();
      }
      await loadPageFonts(pageData);
      const urls = new Map(Object.entries(moduleSceneUrls));
      errorLog.takeErrors();
      stage = createPageStage({
        element,
        pageData,
        importModuleScene: async (sceneId) => {
          const url = urls.get(sceneId);
          if (url === undefined) {
            throw new Error(
              `The stage page has no code for scene "${sceneId}"`,
            );
          }
          const importModule = window.yumekitImport;
          if (importModule === undefined) {
            throw new Error("The stage page has no module importer");
          }
          return importModule(url);
        },
        errorLog,
        mode: "render",
      });
    },
    seek: (frame) => stage?.seek(frame) ?? Promise.resolve(notLoaded),
    inspect: () => frameFindingsOf({ stageElement: element, project }),
  };
}

window.yumekitStage = startStagePage();
