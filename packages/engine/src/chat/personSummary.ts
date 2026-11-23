import { personSentenceOf } from "@yumekit/brain";
import { scenesRowOf, type ProjectSnapshot } from "@yumekit/project";
import { addedSoundSentenceOf } from "./addedSound.js";

type SceneReference = { sceneId: string } | { clipId: string };

const sceneSentences: Record<string, (number: string) => string> = {
  put_scene: (number) => `You changed the text of scene ${number}.`,
  resize_scene_clip: (number) => `You changed the length of scene ${number}.`,
  move_scene_clip: (number) => `You moved scene ${number}.`,
  remove_scene_clip: (number) => `You deleted scene ${number}.`,
  duplicate_scene_clip: (number) => `You duplicated scene ${number}.`,
  place_video: (number) => `You added a video clip to scene ${number}.`,
};

function referenceOf(options: {
  tool: string;
  input: Readonly<Record<string, unknown>>;
}): SceneReference | undefined {
  const { input } = options;
  const sceneId = input["scene_id"];
  const clipId =
    options.tool === "place_video"
      ? input["replace_clip_id"]
      : input["clip_id"];
  if (options.tool === "put_scene" && typeof sceneId === "string") {
    return { sceneId };
  }
  return typeof clipId === "string" ? { clipId } : undefined;
}

function sceneNumberOf(options: {
  snapshot: ProjectSnapshot;
  reference: SceneReference;
}): number | undefined {
  const { snapshot, reference } = options;
  for (const output of snapshot.project.outputs) {
    const timeline = snapshot.timelines.find(
      (candidate) => candidate.outputId === output.id,
    );
    const row = scenesRowOf({
      tracks: timeline?.tracks ?? [],
      scenes: snapshot.scenes,
    });
    const clips = [...(row?.clips ?? [])].sort(
      (...[first, second]) => first.startFrame - second.startFrame,
    );
    const index = clips.findIndex((clip) =>
      "sceneId" in reference
        ? clip.sceneId === reference.sceneId
        : clip.id === reference.clipId,
    );
    if (index !== -1) return index + 1;
  }
  return undefined;
}

export function personSummaryOf(options: {
  tool: string;
  input: Readonly<Record<string, unknown>>;
  snapshot: ProjectSnapshot;
}): string {
  const addedSound = addedSoundSentenceOf(options);
  if (addedSound !== undefined) return addedSound;
  const sentence = sceneSentences[options.tool];
  const reference = referenceOf(options);
  const number =
    reference === undefined
      ? undefined
      : sceneNumberOf({ snapshot: options.snapshot, reference });
  if (sentence === undefined || number === undefined) {
    return personSentenceOf(options.tool);
  }
  return sentence(String(number));
}
