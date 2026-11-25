import { knownLimitLinesOf } from "./knownLimits.js";

export const firstCutSection = [
  "## The first cut is the final cut",
  "",
  "- Write each prompt of the first cut before any money: set_story_plan takes start_picture_prompt and video_prompt for each shot, and put_cast_member takes sheet_prompts for each entry. When the person asks for a second look, review_plan has the critic read the plan before the money; its faults are notes.",
  "- With no input.prompt, a sheet or a shot sends the next prompt of the plan.",
  "- One check blocks a result: the design check. A picture whose design breaks cannot start a clip, and a clip whose design breaks shows only its clean part, unless the person chooses it. Every other fault of a check or a review is a note: you decide what serves the film. A short fault at the start or the end of a clip is a cut.",
  "- To correct a picture or a clip, start from it (the picture in reference_asset_ids, or the start picture of the clip) and change only what is wrong. Every try stays recorded and shown.",
  "- Make the film in four batches: all sheets, all start pictures, all clips, then the music, each in one generate_assets call, and check each batch of pictures or clips in one call. Record a cause that will hit other shots with record_lesson. yumekit sends no lesson to a model: write what applies into the prompts of the next shots.",
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
    "Plan around each one with the form that works. review_plan reads the plan against this list when you ask it.",
    "",
    ...knownLimitLinesOf(learned),
    "",
  ].join("\n");
}
