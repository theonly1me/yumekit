import type { AnswerStep } from "./chatSchemas.js";

const reading = "Reading the project";
const puttingTogether = "Putting the video together";
const changingPlatforms = "Changing the platforms";
const lookingAtTheVideo = "Looking at the video";

const sentencesByTool: Record<string, string> = {
  get_project: reading,
  get_timeline: reading,
  get_scene: reading,
  get_scene_guide: reading,
  get_asset_words: reading,
  list_assets: reading,
  list_kit_scenes: reading,
  list_media_tools: reading,
  set_script: "Writing the script",
  set_bible: "Writing the style notes",
  put_cast_member: "Changing the cast",
  remove_cast_member: "Changing the cast",
  put_scene: "Writing a scene",
  remove_scene: "Removing a scene",
  generate_asset: "Making a picture or a sound",
  import_asset: "Adding a file",
  remove_asset: "Removing a file",
  place_narration: "Placing the voice",
  place_video: "Placing a video clip",
  align_words: "Matching the captions to the voice",
  add_clip: puttingTogether,
  update_clip: puttingTogether,
  remove_clip: puttingTogether,
  set_timeline: puttingTogether,
  copy_timeline: puttingTogether,
  add_output: changingPlatforms,
  remove_output: changingPlatforms,
  add_platform: changingPlatforms,
  remove_platform: changingPlatforms,
  resize_scene_clip: "Changing the length of a scene",
  move_scene_clip: "Moving a scene",
  remove_scene_clip: "Deleting a scene",
  duplicate_scene_clip: "Duplicating a scene",
  set_track_off: "Turning a sound on or off",
  set_video_style: "Changing how the video is made",
  set_look: "Changing the look",
  set_transitions: "Setting how the scenes change",
  preview_frame: lookingAtTheVideo,
  preview_frames: lookingAtTheVideo,
  preview_scenes: lookingAtTheVideo,
  render_still: lookingAtTheVideo,
  render_video: "Exporting the video",
  undo: "Undoing a change",
  redo: "Doing a change again",
  delete_everything: "Clearing the project",
};

export const fallbackStepSentence = "Working on the project";

export interface StepLine {
  key: string;
  text: string;
  state: AnswerStep["state"];
}

export function stepSentenceOf(tool: string): string {
  return (
    Object.entries(sentencesByTool).find(([name]) => name === tool)?.[1] ??
    fallbackStepSentence
  );
}

export function stepLinesOf(steps: AnswerStep[]): StepLine[] {
  const lines: StepLine[] = [];
  for (const step of steps) {
    const text = stepSentenceOf(step.tool);
    const last = lines.at(-1);
    if (last?.text === text) {
      lines[lines.length - 1] = { ...last, state: step.state };
    } else {
      lines.push({ key: step.callId, text, state: step.state });
    }
  }
  return lines;
}
