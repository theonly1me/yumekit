import { createHash } from "node:crypto";
import type { StagePageLoad } from "../page/stagePageData.js";
import type { LoadedOutput } from "./loadOutput.js";
import { fileUrlOf, stagePageDataOf } from "./stagePageDataOf.js";

function versionOf(code: string | undefined): string {
  return createHash("sha256")
    .update(code ?? "")
    .digest("hex")
    .slice(0, 16);
}

export async function stagePageLoadOf(
  loaded: LoadedOutput,
): Promise<StagePageLoad> {
  const pageData = await stagePageDataOf(loaded);
  const moduleSceneUrls = Object.entries(pageData.sceneSources).flatMap(
    ([sceneId, source]) =>
      source.kind === "module"
        ? [
            [
              sceneId,
              `${fileUrlOf(source.file)}?code=${versionOf(loaded.snapshot.sceneCode[sceneId])}`,
            ] as const,
          ]
        : [],
  );
  return { pageData, moduleSceneUrls: Object.fromEntries(moduleSceneUrls) };
}
