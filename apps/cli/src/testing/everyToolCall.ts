import type { JsonObject } from "@yumekit/tools";

export interface ScriptedCall {
  name: string;
  input: JsonObject;
}

const mainTrack = {
  id: "main",
  kind: "scene",
  clips: [{ id: "a", scene_id: "intro", start_frame: 0, duration_frames: 30 }],
};

export function everyToolCall(importSourcePath: string): ScriptedCall[] {
  return [
    { name: "get_project", input: {} },
    { name: "list_kit_scenes", input: {} },
    { name: "get_scene_guide", input: {} },
    { name: "list_media_tools", input: {} },
    { name: "set_script", input: { script: "A fox finds a lake." } },
    {
      name: "set_bible",
      input: {
        style: "paper cutouts",
        palette: ["#18203a"],
        voice: "calm",
        cast: [{ id: "fox", name: "Fox", description: "A red fox" }],
      },
    },
    {
      name: "add_output",
      input: {
        output_id: "tall",
        label: "Tall",
        width_pixels: 180,
        height_pixels: 320,
      },
    },
    {
      name: "put_scene",
      input: {
        scene_id: "intro",
        title: "Intro",
        kit_component: "title-card",
        props: { heading: "The lake" },
      },
    },
    { name: "get_scene", input: { scene_id: "intro" } },
    { name: "get_scene", input: { scene_id: "missing" } },
    { name: "set_timeline", input: { output_id: "wide", tracks: [mainTrack] } },
    {
      name: "add_clip",
      input: {
        output_id: "wide",
        track_id: "main",
        clip_id: "b",
        scene_id: "intro",
        start_frame: 30,
        duration_frames: 15,
      },
    },
    {
      name: "update_clip",
      input: { output_id: "wide", clip_id: "b", start_frame: 40 },
    },
    {
      name: "resize_scene_clip",
      input: { clip_id: "a", duration_frames: 20 },
    },
    { name: "move_scene_clip", input: { clip_id: "b", to_index: 0 } },
    { name: "duplicate_scene_clip", input: { clip_id: "a" } },
    { name: "remove_scene_clip", input: { clip_id: "a-copy" } },
    { name: "set_track_off", input: { track_id: "main", off: true } },
    { name: "set_track_off", input: { track_id: "main", off: false } },
    { name: "set_video_style", input: { video_style: "mix" } },
    { name: "set_transitions", input: { kind: "fade" } },
    { name: "get_timeline", input: { output_id: "wide" } },
    { name: "remove_clip", input: { output_id: "wide", clip_id: "b" } },
    {
      name: "copy_timeline",
      input: { from_output_id: "wide", to_output_id: "tall" },
    },
    { name: "remove_output", input: { output_id: "tall" } },
    { name: "add_platform", input: { platform_id: "square" } },
    { name: "remove_platform", input: { platform_id: "square" } },
    { name: "set_look", input: { look: "neon" } },
    {
      name: "put_scene",
      input: {
        scene_id: "spare",
        title: "Spare",
        kit_component: "title-card",
        props: { heading: "Spare" },
      },
    },
    { name: "remove_scene", input: { scene_id: "spare" } },
    {
      name: "generate_asset",
      input: {
        asset_id: "line-one",
        capability: "speech",
        input: { text: "one two three four" },
      },
    },
    { name: "get_asset_words", input: { asset_id: "line-one" } },
    {
      name: "place_narration",
      input: {
        output_id: "wide",
        asset_id: "line-one",
        start_frame: 0,
        with_captions: true,
      },
    },
    {
      name: "generate_asset",
      input: {
        asset_id: "still",
        capability: "image",
        input: { prompt: "a lake", width_pixels: 64, height_pixels: 48 },
      },
    },
    {
      name: "generate_asset",
      input: {
        asset_id: "clip",
        capability: "video",
        input: { prompt: "a lake at dawn", duration_seconds: 1 },
        first_frame_asset_id: "still",
      },
    },
    {
      name: "place_video",
      input: { output_id: "wide", asset_id: "clip", start_frame: 30 },
    },
    {
      name: "generate_asset",
      input: {
        asset_id: "tune",
        capability: "music",
        input: { prompt: "calm", duration_seconds: 1 },
      },
    },
    { name: "align_words", input: { asset_id: "tune", text: "hello world" } },
    {
      name: "import_asset",
      input: { asset_id: "logo", kind: "image", source_path: importSourcePath },
    },
    { name: "list_assets", input: {} },
    { name: "undo", input: {} },
    { name: "redo", input: {} },
    { name: "preview_frame", input: { output_id: "wide", frame: 10 } },
    { name: "preview_frames", input: { output_id: "wide", frames: [0, 20] } },
    {
      name: "preview_scenes",
      input: { output_id: "wide", scene_ids: ["intro"] },
    },
    { name: "render_still", input: { output_id: "wide", frame: 0 } },
    {
      name: "render_video",
      input: { output_id: "wide", frame_count: 10, scale: 0.25 },
    },
  ];
}
