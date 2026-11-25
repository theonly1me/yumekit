import type { ProjectSnapshot } from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import { clipEndIdOf, usesPicture } from "./continuity.js";

export function cutNoteOf(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): string | undefined {
  const { snapshot, request } = options;
  const shots = snapshot.bible.storyPlan?.shots ?? [];
  const index = shots.findIndex((shot) => shot.id === request.shot_id);
  const shot = shots[index];
  const before = shots[index - 1];
  if (shot === undefined || before === undefined) return undefined;
  if (shot.continuesShotId !== undefined) return undefined;
  if (before.placeId !== shot.placeId) return undefined;
  const pictureId = clipEndIdOf(before);
  if (pictureId === undefined) return undefined;
  if (usesPicture({ snapshot, request, pictureId })) return undefined;
  return `Shot "${shot.id}" is in the same place as "${before.id}" and starts on its own start picture, as a cut to a new camera position. If it continues the last frame of "${before.id}" with the same camera, set continues_shot "${before.id}" on it with set_story_plan and start from "${pictureId}".`;
}
