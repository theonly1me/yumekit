import type { RenderFailure } from "../renderFailure.js";
import { inspectSceneCode } from "../sceneCode/inspectSceneCode.js";
import type { LoadedOutput } from "./loadOutput.js";
import { sceneIdsOfOutput } from "./sceneIdsAt.js";

export function checkModuleScenes(
  loaded: LoadedOutput,
): RenderFailure | undefined {
  const sceneIds = sceneIdsOfOutput(loaded.timeline);
  for (const [sceneId, code] of Object.entries(loaded.snapshot.sceneCode)) {
    if (!sceneIds.has(sceneId)) {
      continue;
    }
    const inspected = inspectSceneCode({ sceneId, code });
    if (!inspected.ok) {
      return inspected.failure;
    }
  }
  return undefined;
}
