import type { RenderFailure } from "../renderFailure.js";
import {
  isPermittedSceneImport,
  permittedSceneImports,
  sharedCodeNameOf,
  sharedImportForm,
} from "./permittedImports.js";

export const sharedCodePrefix = "_shared/";

export function sharedCodeIdOf(name: string): string {
  return `${sharedCodePrefix}${name}`;
}

export function isSharedCodeId(sceneId: string): boolean {
  return sceneId.startsWith(sharedCodePrefix);
}

export function codeLabelOf(sceneId: string): string {
  return isSharedCodeId(sceneId)
    ? `shared code "${sceneId.slice(sharedCodePrefix.length)}"`
    : `scene "${sceneId}"`;
}

function missingSharedName(options: {
  importName: string;
  isSharedCode: boolean;
  sharedNames: readonly string[];
}): string | undefined {
  const name = sharedCodeNameOf(options);
  return name !== undefined && !options.sharedNames.includes(name)
    ? name
    : undefined;
}

export function importFailureOf(options: {
  sceneId: string;
  importNames: string[];
  sharedNames: readonly string[];
}): RenderFailure | undefined {
  const { sceneId, sharedNames } = options;
  const isSharedCode = isSharedCodeId(sceneId);
  for (const importName of options.importNames) {
    const missing = missingSharedName({
      importName,
      isSharedCode,
      sharedNames,
    });
    if (missing !== undefined) {
      return {
        kind: "scene-import-not-permitted",
        sceneId,
        importName,
        message: `The code of ${codeLabelOf(sceneId)} imports "${importName}", but the project has no shared code "${missing}". Write it first with put_shared_code.`,
      };
    }
    const isShared =
      sharedCodeNameOf({ importName, isSharedCode }) !== undefined;
    if (!isShared && !isPermittedSceneImport(importName)) {
      const sharedForm = isSharedCode ? "./<name>" : sharedImportForm;
      return {
        kind: "scene-import-not-permitted",
        sceneId,
        importName,
        message: `The code of ${codeLabelOf(sceneId)} imports "${importName}". A scene may import only ${permittedSceneImports.join(", ")}, and shared code of the project as "${sharedForm}".`,
      };
    }
  }
  return undefined;
}
