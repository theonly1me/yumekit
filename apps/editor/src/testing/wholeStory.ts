import type { RunningEngine } from "./runEngine.js";
import { forgeShot, storyArc } from "./storyProject.js";

export const forgeStory = {
  premise:
    "A young smith must forge a blade that will not break before her brother leaves for a war that broke their father.",
  world: "A mountain town that lives from its forges.",
  world_rule: "A blade that breaks in its first winter brings bad luck.",
  characters: [
    {
      character_id: "aiko",
      name: "Aiko",
      background: "She learned the forge from her father, who never came back.",
      want: "a blade that brings her brother home",
      fear: "that her steel cracks as her father's did",
      does_not_know: "her father's last blade did not break",
    },
  ],
  opposing_force: {
    force_id: "winter",
    name: "The first winter",
    what: "A cold that cracks steel that was forged in haste.",
    why: "It tests every blade, and it does not care whose.",
  },
  arc: [
    { step_id: "the-crack", step: "Her first blade cracks in the snow." },
    { step_id: "the-fold", step: "She learns to fold the steel." },
    { step_id: "the-test", step: "The blade meets the first winter." },
  ],
  unknown_at_end: "Whether the blade holds, and whether he comes home.",
};

export async function writeForgeStory(engine: RunningEngine): Promise<void> {
  await engine.callTool({ name: "set_story", input: forgeStory });
  await engine.callTool({
    name: "set_story_plan",
    input: {
      ...storyArc,
      form: "trailer",
      shots: [{ ...forgeShot, inherits: "", story_fact: "the-crack" }],
    },
  });
  await engine.callTool({
    name: "put_cast_member",
    input: {
      cast_id: "smith",
      kind: "person",
      name: "Aiko",
      description: "Aiko",
      story_character_id: "aiko",
    },
  });
}
