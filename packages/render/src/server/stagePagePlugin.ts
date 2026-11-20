import { join, sep } from "node:path";
import type { Plugin } from "vite";
import { stageEntryFile, stagePageEntryFile } from "../packagePaths.js";
import { isPermittedCompiledSceneImport } from "../sceneCode/permittedImports.js";
import type { StagePageData } from "../page/stagePageData.js";

const stageDataModuleId = "virtual:yumekit-stage-data";
const resolvedStageDataModuleId = `\0${stageDataModuleId}`;

export const stagePagePath = "/stage.html";

function stagePageHtml(): string {
  return [
    "<!doctype html>",
    '<html><head><meta charset="utf-8">',
    "<style>html, body { margin: 0; background: #000000; overflow: hidden; }</style>",
    '</head><body><div id="stage"></div>',
    `<script type="module" src="/@fs${encodeURI(stagePageEntryFile)}"></script>`,
    "</body></html>",
  ].join("");
}

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
  projectFolder: string;
  pageData: StagePageData;
}): Plugin {
  const scenesFolder = join(options.projectFolder, "scenes") + sep;
  return {
    name: "yumekit-stage-page",
    enforce: "pre",
    async resolveId(...parameters) {
      const [source, importer] = parameters;
      if (source === stageDataModuleId) {
        return resolvedStageDataModuleId;
      }
      if (!importer?.startsWith(scenesFolder)) {
        return null;
      }
      if (!isPermittedCompiledSceneImport(source)) {
        this.error(`A scene may not import "${source}"`);
      }
      return this.resolve(
        source,
        source === "@yumekit/scene" ? stageEntryFile : stagePageEntryFile,
        { skipSelf: true },
      );
    },
    load(id) {
      return id === resolvedStageDataModuleId
        ? stageDataModuleCode(options.pageData)
        : null;
    },
    configureServer(server) {
      server.middlewares.use(stagePagePath, (...parameters) => {
        const [, response] = parameters;
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(stagePageHtml());
      });
    },
  };
}
