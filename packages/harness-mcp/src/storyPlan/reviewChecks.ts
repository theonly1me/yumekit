import type { CastMember, Shot } from "@yumekit/project";
import { regionNames, type ClipMotion } from "@yumekit/render";

function factsLine(member: CastMember): string {
  const facts = member.facts ?? [];
  return `- ${member.name}: ${facts.length === 0 ? "no fixed facts" : facts.join("; ")}`;
}

export function measuresTextOf(motion: ClipMotion): string {
  const parts = regionNames
    .map((...[name, index]) => `${name} ${String(motion.regions[index] ?? 0)}`)
    .join(", ");
  const start =
    motion.startDifference === undefined
      ? "No start picture to compare."
      : `First frame against the start picture: ${String(motion.startDifference.whole)} percent, ${String(motion.startDifference.largestRegion)} percent in the part that differs most.`;
  const warnings =
    motion.warnings.length === 0
      ? "No warnings from the measures."
      : motion.warnings
          .map((warning) => `Warning: ${warning.message}`)
          .join("\n");
  return [
    `Measured motion: ${String(motion.motion)} percent of the picture changes in a step of 1/8 second; ${String(motion.worldMotion)} percent after the camera move; the camera moves ${String(motion.cameraMotion)} percent of the width each second.`,
    `Motion of the world in each part (percent a step): ${parts}. Under 0.6 hardly moves.`,
    start,
    warnings,
  ].join("\n");
}

export function checkListOf(options: {
  shot: Shot;
  cast: CastMember[];
}): string {
  const { shot } = options;
  const members = [shot.placeId, ...shot.castIds].flatMap((castId) => {
    const member = options.cast.find((candidate) => candidate.id === castId);
    return member === undefined ? [] : [member];
  });
  return [
    `Check the clip of shot "${shot.id}" on its frames. Answer each point with what you see. A measure finds change, not meaning: the faults below need your eyes.`,
    `1. Story: did this action happen and complete? "${shot.action}". Is the end state the plan? "${shot.endState}"`,
    "2. Objects: each object keeps its place, its side, and its count (doors, knobs, hinges, windows, props). Nothing appears from nothing or leaves for no reason. A door opens on the side away from its hinges.",
    "3. Body and motion: look closer at each hand and each face at three or more times with preview_assets and a region. Five fingers on each hand with a natural shape; no merged or extra limbs; the grip on the prop stays in the same hand and does not pass through it; joints bend as a body bends; feet touch the ground and do not slide; weight and balance are believable; cloth and hair follow the move; the face keeps its features; the action has a start, a contact, and a follow-through, and the thing it touches reacts.",
    "4. The sheets: each person, place, and prop matches its fixed facts:",
    ...members.map(factsLine),
    "5. The world is alive: something moves in the background (wind, rain, sparks, cloth, hair, dust), unless the plan asks for stillness. Read the measures above.",
    "6. No writing that a person cannot read, unless the plan gives exact text.",
    "Then call review_clip again with verdict: keep, cut with keep_from_seconds and keep_to_seconds for the good part, or redo with the faults. A redo needs a new prompt that names each fault, inside the limits.",
  ].join("\n");
}
