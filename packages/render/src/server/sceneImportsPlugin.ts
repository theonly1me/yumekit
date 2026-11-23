import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, sep } from "node:path";
import type { Plugin } from "vite";
import { stageEntryFile, stagePageEntryFile } from "../packagePaths.js";
import {
  isPermittedCompiledSceneImport,
  sharedCodeNameOf,
} from "../sceneCode/permittedImports.js";

async function sharedModuleIdOf(options: {
  sharedFolder: string;
  name: string;
}): Promise<string> {
  const file = join(options.sharedFolder, `${options.name}.tsx`);
  const code = await readFile(file, "utf8");
  const version = createHash("sha256").update(code).digest("hex").slice(0, 16);
  return `${file}?shared=${version}`;
}

export function sceneImportsPlugin(options: { projectFolder: string }): Plugin {
  const scenesFolder = join(options.projectFolder, "scenes") + sep;
  const sharedFolder = join(scenesFolder, "_shared");
  return {
    name: "yumekit-scene-imports",
    enforce: "pre",
    async resolveId(...parameters) {
      const [source, importer] = parameters;
      if (!importer?.startsWith(scenesFolder)) {
        return null;
      }
      const sharedName = sharedCodeNameOf({
        importName: source,
        isSharedCode: importer.startsWith(sharedFolder + sep),
      });
      if (sharedName !== undefined) {
        return sharedModuleIdOf({ sharedFolder, name: sharedName });
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
