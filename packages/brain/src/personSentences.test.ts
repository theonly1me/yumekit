import { describe, expect, it } from "vitest";
import { defaultPersonSentence, personSentenceOf } from "./index.js";

const toolsThatChangeTheProject = [
  "set_script",
  "set_project_name",
  "set_bible",
  "put_cast_member",
  "remove_cast_member",
  "set_story",
  "set_story_plan",
  "set_chapters",
  "record_lesson",
  "open_take",
  "ready_take",
  "add_output",
  "remove_output",
  "add_platform",
  "remove_platform",
  "set_look",
  "set_tempo",
  "put_scene",
  "put_shared_code",
  "put_work",
  "set_fonts",
  "remove_scene",
  "set_timeline",
  "add_clip",
  "update_clip",
  "remove_clip",
  "copy_timeline",
  "place_narration",
  "place_video",
  "place_picture",
  "place_sound",
  "replace_narration",
  "replace_music",
  "resize_scene_clip",
  "move_scene_clip",
  "remove_scene_clip",
  "duplicate_scene_clip",
  "set_track_off",
  "set_video_style",
  "set_checks",
  "set_approve_pictures_first",
  "set_transitions",
  "generate_asset",
  "generate_assets",
  "import_asset",
  "remove_asset",
  "mark_asset",
  "review_clip",
  "review_sheet",
  "review_plan",
  "review_start",
  "review_several",
  "check_design",
  "check_music",
  "align_words",
  "render_video",
  "make_sharper_copy",
  "delete_everything",
];

describe("the sentence of a change of the person", () => {
  it.each(toolsThatChangeTheProject)(
    "names what %s changed, not only that the project changed",
    (tool) => {
      expect(personSentenceOf(tool)).not.toBe(defaultPersonSentence);
    },
  );

  it("gives each tool its own sentence", () => {
    const sentences = toolsThatChangeTheProject.map(personSentenceOf);

    expect(new Set(sentences).size).toBe(sentences.length);
  });
});
