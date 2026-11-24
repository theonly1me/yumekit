import type { Bible, PlanBriefFault, Shot, StoryPlan } from "@yumekit/project";
import type { HarnessFailure } from "../results.js";

export function plainText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!]+$/, "");
}

function placeTextOf(options: {
  bible: Bible;
  plan: StoryPlan;
  fault: PlanBriefFault;
}): string {
  const { bible, plan, fault } = options;
  if (fault.shotId !== undefined) {
    const shot = plan.shots.find((candidate) => candidate.id === fault.shotId);
    return [shot?.startPicturePrompt ?? "", shot?.videoPrompt ?? ""].join(" ");
  }
  const member = bible.cast.find((candidate) => candidate.id === fault.castId);
  return (member?.facts ?? []).join(" ");
}

function isRestored(options: {
  bible: Bible;
  plan: StoryPlan;
  fault: PlanBriefFault;
}): boolean {
  return plainText(placeTextOf(options)).includes(
    plainText(options.fault.restore),
  );
}

function touchesShot(options: { fault: PlanBriefFault; shot: Shot }): boolean {
  const { fault, shot } = options;
  if (fault.shotId !== undefined) return fault.shotId === shot.id;
  return shot.placeId === fault.castId || shot.castIds.includes(fault.castId);
}

export function openBriefFaultsOf(options: {
  bible: Bible;
  plan: StoryPlan;
}): PlanBriefFault[] {
  return (options.plan.review?.briefFaults ?? []).filter(
    (fault) => !isRestored({ ...options, fault }),
  );
}

export function briefFaultFailureOf(options: {
  bible: Bible;
  plan: StoryPlan;
  shot: Shot | undefined;
}): HarnessFailure | undefined {
  const { shot } = options;
  if (shot === undefined) return undefined;
  const [fault] = openBriefFaultsOf(options).filter((candidate) =>
    touchesShot({ fault: candidate, shot }),
  );
  if (fault === undefined) return undefined;
  const place =
    fault.shotId === undefined
      ? `the facts of "${fault.castId}" (put_cast_member)`
      : `the start_picture_prompt or the video_prompt of shot "${fault.shotId}" (set_story_plan)`;
  return {
    kind: "plan-breaks-brief",
    message: `The plan check found that the plan breaks a fact of the person's brief, and that still blocks shot "${shot.id}". The fact of "${fault.castId}" from the brief: "${fault.briefFact}". ${fault.seen}`,
    hint: `Put this exact text in ${place}: "${fault.restore}". Then call again. The plan check does not run again.`,
  };
}
