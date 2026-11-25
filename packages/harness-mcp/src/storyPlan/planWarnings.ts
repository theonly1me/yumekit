import type { CastMember, Shot, StoryPlan } from "@yumekit/project";
import { directionWarningsOf } from "./directionWarnings.js";
import { videoPromptLimit } from "./firstFrameRule.js";
import { isSameState, spaceWarningsOf } from "./spaceWarnings.js";

export const largestPlaceCount = 2;

const passageOnly =
  /\b(walks?|walking|wanders?|wandering|strolls?|strolling|stands?|standing|looks around|looking around|gazes?|gazing|explores?|exploring|arrives?|arriving)\b/i;

const joinedAction = /\b(and|then|until)\b/i;

function onlyPasses(action: string): boolean {
  return passageOnly.test(action) && !joinedAction.test(action);
}

function changeWarnings(shots: Shot[]): string[] {
  return shots.flatMap((shot) => {
    const sameState = isSameState({
      first: shot.startState,
      second: shot.endState,
    });
    if (sameState) {
      return [
        `Nothing changes in shot "${shot.id}": its start state and end state are the same. Give it an action with a result.`,
      ];
    }
    if (onlyPasses(shot.action)) {
      return [
        `The action of shot "${shot.id}" walks, stands, or looks. That is not an action unless it changes something. Name what the character does and what is different after it.`,
      ];
    }
    return [];
  });
}

function inheritWarnings(shots: Shot[]): string[] {
  return shots
    .slice(0, -1)
    .flatMap((shot) =>
      shot.inherits.trim() === ""
        ? [
            `Shot "${shot.id}" gives the next shot nothing. Say what the next shot inherits, so each shot follows from the one before.`,
          ]
        : [],
    );
}

function placeWarnings(shots: Shot[]): string[] {
  const places = [...new Set(shots.map((shot) => shot.placeId))];
  if (places.length <= largestPlaceCount) return [];
  return [
    `The plan has ${String(places.length)} places (${places.join(", ")}). One place and one unbroken idea read better than many worlds. Keep more places only when the story needs each one.`,
  ];
}

function castWarnings(options: {
  shots: Shot[];
  cast: CastMember[];
}): string[] {
  const known = new Set(options.cast.map((member) => member.id));
  const missing = [
    ...new Set(
      options.shots.flatMap((shot) => [shot.placeId, ...shot.castIds]),
    ),
  ].filter((castId) => !known.has(castId));
  if (missing.length === 0) return [];
  return [
    `The cast has no entry for ${missing.join(", ")} yet. Add each one with put_cast_member, with its facts and its sheet picture, before the first picture of a shot that shows it.`,
  ];
}

function promptWarnings(shots: Shot[]): string[] {
  return shots.flatMap((shot) => {
    const length = (shot.videoPrompt ?? "").length;
    return length > videoPromptLimit
      ? [
          `The video prompt of shot "${shot.id}" has ${String(length)} characters. Keep it under ${String(videoPromptLimit)} and about this shot only: the start picture carries the look.`,
        ]
      : [];
  });
}

export function planWarningsOf(options: {
  plan: StoryPlan;
  cast: CastMember[];
}): string[] {
  const { shots } = options.plan;
  return [
    ...spaceWarningsOf(shots),
    ...directionWarningsOf(shots),
    ...changeWarnings(shots),
    ...inheritWarnings(shots),
    ...placeWarnings(shots),
    ...promptWarnings(shots),
    ...castWarnings({ shots, cast: options.cast }),
  ];
}
