import { createHash } from "node:crypto";
import type { Bible, CastMember, Shot, StoryPlan } from "@yumekit/project";

export function planMembersOf(options: {
  bible: Bible;
  plan: StoryPlan;
}): CastMember[] {
  const ids = new Set(
    options.plan.shots.flatMap((shot) => [shot.placeId, ...shot.castIds]),
  );
  return options.bible.cast.filter((member) => ids.has(member.id));
}

function shotText(shot: Shot) {
  return {
    id: shot.id,
    purpose: shot.purpose,
    action: shot.action,
    placeId: shot.placeId,
    castIds: shot.castIds,
    camera: shot.camera,
    seconds: shot.seconds,
    startState: shot.startState,
    endState: shot.endState,
    inherits: shot.inherits,
    strikes: shot.strikes ?? [],
    startPicturePrompt: shot.startPicturePrompt ?? "",
    videoPrompt: shot.videoPrompt ?? "",
  };
}

function memberText(member: CastMember) {
  return {
    id: member.id,
    kind: member.kind,
    name: member.name,
    description: member.description,
    facts: member.facts ?? [],
    sheetPrompts: member.sheetPrompts ?? [],
    restrictions: member.restrictions ?? [],
    briefFacts: member.briefFacts ?? [],
  };
}

export function planKeyOf(options: { bible: Bible; plan: StoryPlan }): string {
  const { bible, plan } = options;
  const text = JSON.stringify({
    style: bible.style,
    logline: plan.logline,
    want: plan.want,
    obstacle: plan.obstacle,
    change: plan.change,
    shots: plan.shots.map(shotText),
    cast: planMembersOf(options).map(memberText),
  });
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

export function planGapsOf(options: {
  bible: Bible;
  plan: StoryPlan;
}): string[] {
  const { bible, plan } = options;
  const shotGaps = plan.shots.flatMap((shot) => [
    ...((shot.startPicturePrompt ?? "").trim() === ""
      ? [`shot "${shot.id}" has no start_picture_prompt`]
      : []),
    ...((shot.videoPrompt ?? "").trim() === ""
      ? [`shot "${shot.id}" has no video_prompt`]
      : []),
  ]);
  const ids = [
    ...new Set(plan.shots.flatMap((shot) => [shot.placeId, ...shot.castIds])),
  ];
  const castGaps = ids.flatMap((id) => {
    const member = bible.cast.find((candidate) => candidate.id === id);
    if (member === undefined) return [`"${id}" is not in the cast`];
    return [
      ...((member.facts ?? []).length === 0
        ? [`"${id}" has no fixed facts`]
        : []),
      ...((member.sheetPrompts ?? []).length === 0
        ? [`"${id}" has no sheet_prompts`]
        : []),
    ];
  });
  return [...shotGaps, ...castGaps];
}
