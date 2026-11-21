import type { Plugin } from "vite";
import { stagePageEntryFile } from "../packagePaths.js";
import type { StagePageData } from "../page/stagePageData.js";
import type { VideoFrameServer } from "../videoFrames/videoFrameServer.js";
import { pageHtmlOf, sendHtml, serveAssetFrames } from "./pageResponses.js";

const stageDataModuleId = "virtual:yumekit-stage-data";
const resolvedStageDataModuleId = `\0${stageDataModuleId}`;

export const stagePagePath = "/stage.html";

function stageDataModuleCode(pageData: StagePageData): string {
  const moduleSceneImports = Object.entries(pageData.sceneSources).flatMap(
    ([sceneId, source]) =>
      source.kind === "module"
        ? [
            `${JSON.stringify(sceneId)}: () => import(${JSON.stringify(source.file)})`,
          ]
        : [],
  );
  return [
    `export default ${JSON.stringify(pageData)};`,
    `export const moduleSceneImports = { ${moduleSceneImports.join(", ")} };`,
  ].join("\n");
}

export function stagePagePlugin(options: {
  pageData: StagePageData;
  videoFrames: VideoFrameServer;
}): Plugin {
  return {
    name: "yumekit-stage-page",
    enforce: "pre",
    resolveId(source) {
      return source === stageDataModuleId ? resolvedStageDataModuleId : null;
    },
    load(id) {
      return id === resolvedStageDataModuleId
        ? stageDataModuleCode(options.pageData)
        : null;
    },
    configureServer(server) {
      server.middlewares.use(stagePagePath, (...parameters) => {
        const [, response] = parameters;
        sendHtml({ response, html: pageHtmlOf(stagePageEntryFile) });
      });
      serveAssetFrames({ server, videoFrames: () => options.videoFrames });
    },
  };
}
