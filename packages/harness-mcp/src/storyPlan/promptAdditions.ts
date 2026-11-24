import type { ProjectSnapshot } from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";
import type { HarnessFailure } from "../results.js";

export const firstFrameSentence =
  "The first picture is the exact first frame of one continuous shot with no cut; keep its framing, its characters, and its place.";

export const videoPromptLimit = 1500;

export function startsOnPicture(request: GenerateAssetInput): boolean {
  return (
    request.capability === "video" && request.first_frame_asset_id !== undefined
  );
}

export function firstFrameFailureOf(
  request: GenerateAssetInput,
): HarnessFailure | undefined {
  if (!startsOnPicture(request)) return undefined;
  if ((request.reference_asset_ids ?? []).length === 0) return undefined;
  return {
    kind: "first-frame-only",
    message:
      "A clip with a first frame sends that picture as its only picture. More pictures let the model compose another shot.",
    hint: "Leave out reference_asset_ids. Put what the sheets show into the start picture, and have the critic check it with review_start.",
  };
}

export function longPromptNoteOf(
  request: GenerateAssetInput,
): string | undefined {
  const prompt = request.input["prompt"];
  if (request.capability !== "video" || typeof prompt !== "string") {
    return undefined;
  }
  return prompt.length > videoPromptLimit
    ? `The video prompt has ${String(prompt.length)} characters. Keep it under ${String(videoPromptLimit)}: what moves in time order, the camera, and what stays still.`
    : undefined;
}

function sentenceOf(text: string): string {
  const trimmed = text.trim().replace(/[;]+$/, "");
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function withPromptAdditions(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): GenerateAssetInput {
  const { request, snapshot } = options;
  const prompt = request.input["prompt"];
  const isPictureOrClip =
    request.capability === "image" || request.capability === "video";
  if (!isPictureOrClip || typeof prompt !== "string") return request;
  const style = snapshot.bible.style.trim();
  const lessons = (snapshot.bible.storyPlan?.lessons ?? []).map((lesson) =>
    lesson.text.trim().replace(/[.;]+$/, ""),
  );
  const onPicture = startsOnPicture(request);
  const additions = [
    ...(onPicture && request.shot_id !== undefined ? [firstFrameSentence] : []),
    ...(style === "" || onPicture
      ? []
      : [`Art direction: ${sentenceOf(style)}`]),
    ...(lessons.length === 0
      ? []
      : [`Lessons of this film: ${lessons.join("; ")}.`]),
  ];
  if (additions.length === 0) return request;
  return {
    ...request,
    input: { ...request.input, prompt: `${prompt}\n\n${additions.join(" ")}` },
  };
}
