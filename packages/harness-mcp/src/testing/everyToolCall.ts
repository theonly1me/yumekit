import type { JsonObject } from "@yumekit/tools";
import { sharperCopyCalls, soundEffectCalls } from "./newKindCalls.js";
import { musicCalls, reviewCalls, storyCalls } from "./storyCalls.js";

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
    { name: "get_work", input: {} },
    { name: "list_kit_scenes", input: {} },
    { name: "get_scene_guide", input: {} },
    { name: "list_media_tools", input: {} },
    { name: "list_media_requests", input: {} },
    { name: "set_script", input: { script: "A fox finds a lake." } },
    { name: "set_project_name", input: { name: "Fox at the lake" } },
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
      name: "put_cast_member",
      input: {
        cast_id: "lake",
        kind: "place",
        name: "Lake",
        description: "A cold lake",
      },
    },
    { name: "remove_cast_member", input: { cast_id: "lake" } },
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
    { name: "set_tempo", input: { tempo: 120 } },
    {
      name: "update_clip",
      input: { output_id: "wide", clip_id: "a", duration_beats: 2 },
    },
    {
      name: "put_shared_code",
      input: { name: "theme", code: 'export const accent = "#ff3366";\n' },
    },
    { name: "set_fonts", input: { fonts: [] } },
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
        input: { text: "A fox finds a lake." },
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
        partial: true,
      },
    },
    ...storyCalls,
    {
      name: "generate_asset",
      input: {
        asset_id: "clip",
        capability: "video",
        input: { prompt: "a lake at dawn", duration_seconds: 1 },
        first_frame_asset_id: "still",
        camera_move: "push-in",
        shot_id: "dawn",
      },
    },
    ...reviewCalls,
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
    ...musicCalls,
    ...soundEffectCalls,
    {
      name: "import_asset",
      input: { asset_id: "logo", kind: "image", source_path: importSourcePath },
    },
    { name: "mark_asset", input: { asset_id: "logo", name: "a", seconds: 0 } },
    { name: "preview_assets", input: { assets: [{ asset_id: "logo" }] } },
    { name: "remove_asset", input: { asset_id: "logo" } },
    { name: "remove_asset", input: { asset_id: "clip" } },
    { name: "list_assets", input: {} },
    { name: "undo", input: {} },
    { name: "redo", input: {} },
    { name: "preview_frame", input: { output_id: "wide", frame: 10 } },
    { name: "preview_frames", input: { output_id: "wide", frames: [0, 20] } },
    {
      name: "preview_scenes",
      input: { output_id: "wide", scene_ids: ["intro"] },
    },
    { name: "contact_sheet", input: { output_id: "wide", every_seconds: 0.5 } },
    { name: "render_still", input: { output_id: "wide", frame: 0 } },
    {
      name: "render_video",
      input: { output_id: "wide", frame_count: 10, scale: 0.25 },
    },
    ...sharperCopyCalls,
    { name: "put_work", input: { scenes: [] } },
    { name: "ask_helper", input: { brief: "Draw it.", scene_ids: ["intro"] } },
  ];
}
