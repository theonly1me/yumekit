import { castFactLimits, castKinds, castPromptLimits } from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";
import { looksInput } from "./lookInput.js";

export const maximumCastPictures = 4;

export const putCastMemberInput = {
  cast_id: idInput("The id of the entry, for example 'mia' or 'blue-mug'."),
  kind: z.enum(castKinds).describe("What the entry is."),
  name: z
    .string()
    .trim()
    .min(1)
    .describe("The name, for example 'Mia' or 'The blue mug'."),
  description: z
    .string()
    .describe(
      "How the entry looks in a few words. The harness adds it to each prompt that gives its id in cast_ids. A person: each garment with its color and cut, the hair, the face, and what the design must NOT resemble.",
    ),
  facts: z
    .array(z.string().trim().min(1).max(castFactLimits.characters))
    .max(castFactLimits.count)
    .optional()
    .describe(
      `The fixed facts in words, one fact each (${String(castFactLimits.characters)} characters at most for one fact, ${String(castFactLimits.count)} facts at most; split a long fact in two), that each picture and clip must keep. Each fact is a visual statement, never a bare number: 'side by side, the top of the hero's head reaches its chest', not 'twice his height'. The harness adds them to each prompt. A person: age, build, hair, each garment and its colors, marks and their side, five fingers on each hand, which hand holds which prop and how, and what it must not resemble. A place: where the door is, the side of its hinges and its knob, which way it opens, the window, the light, what is on each wall. A prop: size, material, colors, how a hand holds it. Leave it out to keep the facts of an entry that exists.`,
    ),
  reference_asset_ids: z
    .array(idInput("An image asset that shows the entry."))
    .max(maximumCastPictures)
    .optional()
    .describe(
      `Up to ${String(maximumCastPictures)} image assets that show the entry. Leave it out to keep the pictures of an entry that exists.`,
    ),
  sheet_prompts: z
    .array(z.string().trim().min(1).max(castPromptLimits.characters))
    .min(1)
    .max(castPromptLimits.count)
    .optional()
    .describe(
      `For a film: the prompt of each sheet picture (${String(castPromptLimits.characters)} characters at most for one prompt, ${String(castPromptLimits.count)} prompts at most) that you will send (the sheet, then the hands with the prop), before the harness adds the art direction. review_plan checks them, and the first try sends them. Leave it out to keep them.`,
    ),
  brief_facts: z
    .array(z.string().trim().min(1).max(castFactLimits.characters))
    .max(castFactLimits.count)
    .optional()
    .describe(
      `The person's own words about this entry, as the brief gives them (${String(castFactLimits.characters)} characters at most for one, ${String(castFactLimits.count)} at most), for example 'a head and a half taller than the hero'. They are protected: a later call cannot remove or change one unless person_asked_to_change_brief is true. The critic judges each fact and picture against them. Leave it out to keep them.`,
    ),
  person_asked_to_change_brief: z
    .boolean()
    .optional()
    .describe(
      "true only when the person asked in this request to change a fact of the brief.",
    ),
  story_character_id: idInput(
    "For a person of a story film: the id of the character or the opposing force of the story (set_story) that this entry shows. Leave it out to keep it.",
  ).optional(),
  restrictions: z
    .array(z.string().trim().min(1).max(castFactLimits.characters))
    .max(castFactLimits.count)
    .optional()
    .describe(
      `What the film must never show of this entry (${String(castFactLimits.characters)} characters at most for one, ${String(castFactLimits.count)} at most), when its best sheet keeps a blocking fault, for example 'never show both hands close up'. With restrictions, a failed sheet can be used, and review_plan refuses each shot that breaks one. Give [] to remove them. Leave it out to keep them.`,
    ),
  looks: looksInput,
};
