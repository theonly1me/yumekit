import { createHash } from "node:crypto";
import type { StagePageLoad } from "../page/stagePageData.js";
import type { LoadedOutput } from "./loadOutput.js";
import { fileUrlOf, stagePageDataOf } from "./stagePageDataOf.js";

function versionOf(code: string): string {
  return createHash("sha256").update(code).digest("hex").slice(0, 16);
}

export async function stagePageLoadOf(
  loaded: LoadedOutput,
): Promise<StagePageLoad> {
  const pageData = await stagePageDataOf(loaded);
  const sharedCode = JSON.stringify(loaded.snapshot.sharedCode);
  const moduleSceneUrls = Object.entries(pageData.sceneSources).flatMap(
    ([sceneId, source]) =>
      source.kind === "module"
        ? [
            [
              sceneId,
              `${fileUrlOf(source.file)}?code=${versionOf(`${loaded.snapshot.sceneCode[sceneId] ?? ""}${sharedCode}`)}`,
            ] as const,
          ]
        : [],
  );
  return { pageData, moduleSceneUrls: Object.fromEntries(moduleSceneUrls) };
}
