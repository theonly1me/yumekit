import type { HarnessFailure } from "../results.js";
import type { ShotInput } from "./shotInput.js";
import type { SetStoryPlanInput } from "./storyPlanInput.js";

function stateIssuesOf(shot: ShotInput): string[] {
  const named = new Set(shot.cast_ids);
  return (["start_state", "end_state"] as const).flatMap((key) => {
    const ids = shot[key].map((entry) => entry.cast_id);
    const missing = shot.cast_ids.filter((id) => !ids.includes(id));
    const extra = ids.filter((id) => !named.has(id));
    const twice = ids.filter((...[id, index]) => ids.indexOf(id) !== index);
    return [
      ...missing.map(
        (id) => `${shot.shot_id}.${key} has no entry for "${id}".`,
      ),
      ...extra.map(
        (id) =>
          `${shot.shot_id}.${key} has "${id}", which cast_ids does not name.`,
      ),
      ...twice.map((id) => `${shot.shot_id}.${key} has "${id}" twice.`),
    ];
  });
}

export function planRefusalOf(
  input: SetStoryPlanInput,
): HarnessFailure | undefined {
  const seen = new Set<string>();
  for (const shot of input.shots) {
    if (seen.has(shot.shot_id)) {
      return {
        kind: "id-in-use",
        message: `The plan has the shot id "${shot.shot_id}" twice.`,
        hint: "Give each shot its own id.",
      };
    }
    if (shot.continues_shot !== undefined && !seen.has(shot.continues_shot)) {
      return {
        kind: "invalid-value",
        message: `Shot "${shot.shot_id}" continues "${shot.continues_shot}", which is not an earlier shot of the plan.`,
        hint: "Give continues_shot the id of an earlier shot whose last frame this shot continues with the same camera. Leave it out for a cut.",
      };
    }
    seen.add(shot.shot_id);
  }
  const issues = input.shots.flatMap(stateIssuesOf);
  if (issues.length === 0) return undefined;
  return {
    kind: "state-incomplete",
    message: `Each start and end state needs one entry for each person and prop of the shot: ${issues.join(" ")}`,
    hint: "Give one entry for each id of cast_ids in start_state and in end_state: where, screen, facing, held_by for a prop in a hand, and state. Name each person once; never join two characters in one entry.",
  };
}
