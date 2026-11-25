import type {
  CastMember,
  ProjectSnapshot,
  Shot,
  StoryPlan,
} from "@yumekit/project";
import { knownLimits } from "../../storyGuide/knownLimits.js";
import { lessonLinesOf, lessonRecordsOf } from "../lessonsForYou.js";
import { stateText, strikeText } from "../stateText.js";

function listText(items: string[] | undefined): string {
  return (items ?? []).join("; ");
}

function memberLineOf(member: CastMember): string {
  const parts = [
    `${member.name} (${member.kind} "${member.id}"): ${member.description}`,
    listText(member.facts) === "" ? "" : `Facts: ${listText(member.facts)}.`,
    listText(member.briefFacts) === ""
      ? ""
      : `From the brief of the person: ${listText(member.briefFacts)}.`,
    listText(member.restrictions) === ""
      ? ""
      : `Restrictions: ${listText(member.restrictions)}.`,
    listText(member.planNotes) === ""
      ? ""
      : `Plan notes: ${listText(member.planNotes)}.`,
    member.referenceAssetIds.length === 0
      ? "No sheet yet."
      : `Sheets for reference_asset_ids of the start picture: ${member.referenceAssetIds.join(", ")}.`,
  ];
  return `- ${parts.filter((part) => part !== "").join(" ")}`;
}

function membersOf(options: {
  snapshot: ProjectSnapshot;
  shot: Shot;
}): CastMember[] {
  const ids = [options.shot.placeId, ...options.shot.castIds];
  return ids.flatMap((castId) =>
    options.snapshot.bible.cast.filter((member) => member.id === castId),
  );
}

function limitsOf(options: { plan: StoryPlan; shot: Shot }) {
  const check = options.plan.review?.shots.find(
    (candidate) => candidate.shotId === options.shot.id,
  );
  const named = new Set(check?.limits ?? []);
  const chosen =
    check === undefined
      ? knownLimits
      : knownLimits.filter((limit) => named.has(limit.id));
  return {
    fromPlanCheck: check !== undefined,
    limits: chosen.map((limit) => ({
      id: limit.id,
      limit: limit.limit,
      form: limit.form,
    })),
  };
}

function promptLineOf(options: { name: string; prompt: string | undefined }) {
  return options.prompt === undefined
    ? `${options.name}: none in the plan.`
    : `${options.name} (${String(options.prompt.length)} characters): ${options.prompt}`;
}

export function shotBriefOf(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
  shot: Shot;
}) {
  const { snapshot, plan, shot } = options;
  const members = membersOf(options);
  const missing = [shot.placeId, ...shot.castIds].filter(
    (castId) => !members.some((member) => member.id === castId),
  );
  const lessons = plan.lessons ?? [];
  const limits = limitsOf({ plan, shot });
  const style = snapshot.bible.style.trim();
  const lines = [
    `Brief of shot "${shot.id}". yumekit sends your prompt as you write it and adds nothing. The model knows only your prompt and its pictures, so write in your own words what it needs of this brief.`,
    `Action: ${shot.action}`,
    `Camera: ${shot.camera.size}, ${shot.camera.angle}${shot.camera.lens === undefined ? "" : `, ${shot.camera.lens} lens`}${shot.camera.move === undefined ? "" : `, move ${shot.camera.move}`}. ${String(shot.seconds)} seconds.`,
    `Start: ${stateText(shot.startState)}`,
    `End: ${stateText(shot.endState)}`,
    ...(shot.strikes ?? []).map((strike) => `Strike: ${strikeText(strike)}`),
    `Art direction: ${style === "" ? "none set (set_bible style)" : style}`,
    "The cast and the place of this shot:",
    ...members.map(memberLineOf),
    ...missing.map((castId) => `- "${castId}" is not in the cast yet.`),
    ...(shot.planNotes === undefined || shot.planNotes.length === 0
      ? []
      : [`Plan notes of this shot: ${shot.planNotes.join("; ")}.`]),
    promptLineOf({
      name: "Start picture prompt of the plan",
      prompt: shot.startPicturePrompt,
    }),
    promptLineOf({
      name: "Video prompt of the plan",
      prompt: shot.videoPrompt,
    }),
    ...(lessons.length === 0
      ? []
      : [
          "Lessons of this film (apply the ones that concern this shot):",
          ...lessonLinesOf(lessons),
        ]),
    limits.fromPlanCheck
      ? `Known limits that the plan check named for this shot: ${String(limits.limits.length)}.`
      : "Known limits (the plan check has not rated this shot):",
    ...limits.limits.map(
      (limit) => `- ${limit.id}: ${limit.limit} What works: ${limit.form}`,
    ),
  ];
  const data = {
    shot_id: shot.id,
    art_direction: style,
    cast: members.map((member) => ({
      cast_id: member.id,
      kind: member.kind,
      name: member.name,
      description: member.description,
      facts: member.facts ?? [],
      brief_facts: member.briefFacts ?? [],
      restrictions: member.restrictions ?? [],
      plan_notes: member.planNotes ?? [],
      sheet_asset_ids: member.referenceAssetIds,
    })),
    missing_cast_ids: missing,
    plan_notes: shot.planNotes ?? [],
    start_picture_prompt: shot.startPicturePrompt ?? null,
    video_prompt: shot.videoPrompt ?? null,
    lessons_for_you: lessonRecordsOf(lessons),
    known_limits: limits.limits,
  };
  return { lines, data };
}
