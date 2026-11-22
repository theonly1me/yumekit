const personSentencesByToolName: Record<string, string> = {
  set_script: "You changed the script.",
  set_bible: "You changed the style notes.",
  put_scene: "You changed the text of a scene.",
  remove_scene: "You removed a scene.",
  add_clip: "You added a part to the video.",
  update_clip: "You changed a part of the video.",
  remove_clip: "You removed a part of the video.",
  set_timeline: "You changed the order of the video.",
  copy_timeline: "You copied the video to another shape.",
  add_output: "You added a video size.",
  remove_output: "You removed a video size.",
  add_platform: "You added a platform.",
  remove_platform: "You removed a platform.",
  place_narration: "You added the voice.",
  place_video: "You added a video clip to a scene.",
  generate_asset: "You made a new picture or sound.",
  import_asset: "You added a file to the project.",
  align_words: "You matched the captions to the voice.",
  resize_scene_clip: "You changed the length of a scene.",
  move_scene_clip: "You moved a scene.",
  remove_scene_clip: "You deleted a scene.",
  duplicate_scene_clip: "You duplicated a scene.",
  set_track_off: "You turned a sound or the captions on or off.",
  delete_everything: "You cleared the project.",
};

export const defaultPersonSentence = "You changed the project.";

export function personSentenceOf(toolName: string): string {
  return (
    Object.entries(personSentencesByToolName).find(
      ([name]) => name === toolName,
    )?.[1] ?? defaultPersonSentence
  );
}
