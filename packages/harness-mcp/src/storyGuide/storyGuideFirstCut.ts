import { knownLimitLinesOf } from "./knownLimits.js";

export const firstCutSection = [
  "## The first cut is the final cut",
  "",
  "- Write each prompt of the first cut before any money: set_story_plan takes start_picture_prompt and video_prompt for each shot, and put_cast_member takes sheet_prompts for each entry. review_plan then has the critic refuse what is likely to fail. A refusal of the plan costs no media money; a refused picture or clip does.",
  "- The first try of a sheet or a shot sends the reviewed prompt: leave out input.prompt and the harness uses it.",
  "- Each fault of the critic is blocking or a note. Only a blocking fault refuses: a doubled object, a wrong side, a wrong count in the frame, a missing planned action, a broken body, merged fingers that a viewer sees, a missed contact, an effect with no source, a likeness to a known design. A note is a difference that a viewer would not see.",
  "- Tries: after one refusal, the second try starts from the refused version (the refused picture in reference_asset_ids, or the start picture of the refused clip) and changes only the named faults. After two, one simplified try with simpler_form. After three, keep the best sheet with restrictions on its cast entry, restage or drop the shot, or ask the person.",
  "- After the plan passes, make the sheets, then the easiest and the hardest shot of the plan check. Record the cause of each refusal with record_lesson. yumekit sends no lesson to a model: write what applies into the prompts of the next shots. Then make the rest in film order.",
  "- A refused shot does not stop the film: the next shot starts from the start state of the plan. Restage or drop the refused one later.",
  "- Sheets and start pictures use the strongest picture model of the service unless the person picked one: every later picture copies them.",
  "",
].join("\n");

export const factsSection = [
  "## Facts a picture can show",
  "",
  '- A fact is a visual statement. Never a bare number or a ratio: "side by side, the top of the hero\'s head reaches the lord\'s shoulder", not "a head and a half taller"; "as wide as two of the hero side by side", not "twice his width".',
  "- A person names each garment with its color and cut, the hair, the face, and what the design must NOT resemble. A thin description lets the model borrow a known design.",
  '- Weak (the third film): "a deep indigo haori with a white storm-cloud pattern at the hem, worn open over a black jacket, dark grey hakama, white leg wraps". The model drew the buttoned black uniform and the badge of the characters of an existing series, and the hero had to be made again.',
  '- Strong (the same film, made again): "a dark slate-grey kimono with a crossed collar, tied with a wide rust-red cloth sash; slim black trousers tucked into black cloth shin guards tied with cords; black tabi socks and straw sandals; a long sleeveless indigo coat, worn open, with a white storm-cloud pattern along its hem; a round straw travel hat on his back. No belt buckle, no buttons, no standing collar."',
  "- Describe a shape, not a simile: the model draws the compared thing.",
  "",
].join("\n");

export function knownLimitsSection(
  learned: { text: string; cause: string }[],
): string {
  return [
    "## Known limits of the picture and video models",
    "",
    "Plan around each one with the form that works. review_plan checks the plan against this list.",
    "",
    ...knownLimitLinesOf(learned),
    "",
  ].join("\n");
}
