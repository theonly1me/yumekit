import { join, sep } from "node:path";
import type { Plugin } from "vite";
import { stageEntryFile, stagePageEntryFile } from "../packagePaths.js";
import { isPermittedCompiledSceneImport } from "../sceneCode/permittedImports.js";

export function sceneImportsPlugin(options: { projectFolder: string }): Plugin {
  const scenesFolder = join(options.projectFolder, "scenes") + sep;
  return {
    name: "yumekit-scene-imports",
    enforce: "pre",
    async resolveId(...parameters) {
      const [source, importer] = parameters;
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
  };
}
