import type { Harness, ToolCall } from "./harnessFixture.js";
import { shotOf, type ShotDraft } from "./storyFixture.js";

export const bellStory = {
  premise:
    "A girl who hears the bell under the frozen lake ring for her grandfather goes under the ice to silence it.",
  world: "A fishing village on a lake that is frozen for half of the year.",
  world_rule: "The bell rings once before a death.",
  characters: [
    {
      character_id: "oda",
      name: "Oda",
      background: "She is 12, and her grandfather raised her.",
      want: "to keep her grandfather",
      fear: "a winter alone",
      does_not_know: "her grandfather went under the ice once himself",
    },
  ],
  opposing_force: {
    force_id: "keeper",
    name: "The Keeper of the Bell",
    what: "A miller who drowned a hundred years ago.",
    why: "He rings the bell so that nobody dies without a goodbye.",
  },
  arc: [
    { step_id: "the-nets", step: "Oda and her grandfather mend nets." },
    { step_id: "the-ring", step: "The bell rings under her feet." },
    { step_id: "the-hole", step: "She cuts through the ice at night." },
  ],
  unknown_at_end: "Whether she silences the bell.",
};

export function writeStory(options: {
  harness: Harness;
  changes?: Record<string, unknown>;
}): Promise<ToolCall> {
  return options.harness.call({
    name: "set_story",
    arguments: { ...bellStory, ...options.changes },
  });
}

export function setStoryPlan(options: {
  harness: Harness;
  shots: (ShotDraft & { story_fact?: string })[];
  form?: string;
}): Promise<ToolCall> {
  return options.harness.call({
    name: "set_story_plan",
    arguments: {
      ...(options.form === undefined ? {} : { form: options.form }),
      logline: "A girl goes under the ice to silence a bell.",
      want: "to keep her grandfather",
      obstacle: "the keeper of the bell",
      change: "she learns why the bell rings",
      shots: options.shots.map((draft) => ({
        ...shotOf(draft),
        ...(draft.story_fact === undefined
          ? {}
          : { story_fact: draft.story_fact }),
      })),
    },
  });
}

export function notesOf(call: ToolCall): string[] {
  const notes = call.data["story_notes"];
  return Array.isArray(notes)
    ? notes.filter((note) => typeof note === "string")
    : [];
}
