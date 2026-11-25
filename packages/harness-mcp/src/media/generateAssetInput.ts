import { cameraMoveIds } from "@yumekit/project";
import { z } from "zod";
import { idInput, jsonObjectInput } from "../inputs.js";
import { personChoseThisPictureInput } from "../storyPlan/designGate.js";
import { kitSheetInput } from "../storyPlan/kitSheets.js";

export const toolNameByCapability = {
  image: "generate_image",
  speech: "generate_speech",
  music: "generate_music",
  video: "generate_video",
  "sound-effect": "generate_sound_effect",
  "talking-clip": "generate_talking_clip",
  sharper: "sharpen_media",
} as const;

export const generateAssetInput = {
  asset_id: idInput(
    "The id of the new asset, for example 'narration-intro' or 'hero-image'.",
  ),
  capability: z
    .enum([
      "image",
      "speech",
      "music",
      "video",
      "sound-effect",
      "talking-clip",
      "sharper",
    ])
    .describe(
      "What to make. list_media_tools shows which server has which capability.",
    ),
  server: z
    .string()
    .optional()
    .describe(
      "The media server from list_media_tools. Leave it out to use the default server of the capability.",
    ),
  model: z
    .string()
    .min(1)
    .optional()
    .describe(
      "The id of a model of the server, from the description of the server in list_media_tools. Leave it out to use the default model.",
    ),
  input: jsonObjectInput.describe(
    'The input of the media tool, with snake_case names and time in seconds. image: prompt (required), width_pixels, height_pixels, transparent_background. speech: text (required), voice, instructions, speed, and pronunciations for a name that the voice does not know, for example {"Hoshi": "hoe she"}. music: prompt and duration_seconds (both required), and for the music of this computer style, tempo, seed, and energy (2 to 8 values from 0 to 1 for how full the music is over its length). video: prompt and duration_seconds (both required), width_pixels, height_pixels, with_audio (default true). sound-effect: prompt (required), duration_seconds. talking-clip: prompt (how the person moves, optional), with the person in media_asset_id and the voice in voice_asset_id. sharper: scale (2 or 4, required), with the picture or the video clip in media_asset_id. The harness adds output_directory and file_stem. Give reference images, a first frame, and a last frame as asset ids in the fields below, not as paths.',
  ),
  reference_asset_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Image asset ids for the image or video tool to follow, for example a character sheet. The harness gives the tool their file paths as reference_image_paths.",
    ),
  cast_ids: z
    .array(z.string())
    .optional()
    .describe(
      "The ids of the cast entries that the picture or the video clip shows. The harness adds the name and the description of each entry to the prompt, and its reference pictures to reference_asset_ids when the model accepts reference pictures.",
    ),
  first_frame_asset_id: z
    .string()
    .optional()
    .describe(
      "An image asset id for the first frame of a video. The harness gives the tool its file path as first_frame_path.",
    ),
  last_frame_asset_id: z
    .string()
    .optional()
    .describe(
      "An image asset id for the last frame of a video, so two clips join with no jump. Only for a model whose accepts has last_frame; most models also need first_frame_asset_id. The harness gives the tool its file path as last_frame_path.",
    ),
  media_asset_id: z
    .string()
    .optional()
    .describe(
      "For the capability sharper: the image or video asset id to copy at a larger size. For talking-clip: the image or video asset of the person who speaks. The harness gives the tool its file path as media_path. Pick a model whose accepts has image_input for a picture or video_input for a video clip.",
    ),
  voice_asset_id: z
    .string()
    .optional()
    .describe(
      "Only for the capability talking-clip: the audio asset id of the voice that the person speaks, usually the narration. The harness gives the tool its file path as audio_path. The clip is as long as the voice, and its seconds count toward the limit of generated video.",
    ),
  voice_part: z
    .strictObject({
      start_seconds: z
        .number()
        .min(0)
        .describe("Where the part starts in the voice file."),
      duration_seconds: z
        .number()
        .positive()
        .describe("The length of the part."),
      lead_seconds: z
        .number()
        .min(0)
        .optional()
        .describe(
          "Silence before the part, so the clip starts before the voice. 0 by default.",
        ),
    })
    .optional()
    .describe(
      "Only with voice_asset_id: use one part of the voice file, for example the words of one scene of a long narration. Leave it out to use the whole file.",
    ),
  shot_id: z
    .string()
    .optional()
    .describe(
      "The shot of the story plan that this start picture or video clip shows. A video clip of an ai-video or mix project, or of a project with a story plan, needs it. The harness adds the place and the cast of the shot to cast_ids, and the camera move of the shot when the call gives none. The place and each person and prop of the shot need a sheet: fixed facts and a picture.",
    ),
  sheet_of: z
    .string()
    .optional()
    .describe(
      "The cast entry whose sheet picture this call makes. The first try sends a reviewed prompt of its sheet_prompts (leave out input.prompt to use it). The rule of tries applies: the second try gives a refused picture in reference_asset_ids, the third gives simpler_form, and then the tries are used up. A sheet picture uses the strongest picture model of the service unless the person picked one.",
    ),
  simpler_form: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe(
      "For the third try of a sheet or a shot, after two refusals: what is simpler now, from the known limits of get_story_guide.",
    ),
  person_asked_for_another_try: z
    .boolean()
    .optional()
    .describe(
      "true permits one more try of a sheet or a shot whose tries are used up. Give it only when the person asked for another try in this request.",
    ),
  key_picture: z
    .enum(["start", "end"])
    .optional()
    .describe(
      "With shot_id and the capability image: which key picture of the shot this is. end is the picture that the clip ends on (last_frame_asset_id), for a move with a clear end pose; review_start checks it with end_picture_asset_id. Default start.",
    ),
  person_chose_this_picture: personChoseThisPictureInput,
  ...kitSheetInput,
  camera_move: z
    .string()
    .optional()
    .describe(
      `The named camera move of a video, as a label for the record and the editor. yumekit adds no text for it: write the camera in the prompt. The ids: ${cameraMoveIds.join(", ")}. get_scene_guide gives one line for each.`,
    ),
};

export type GenerateAssetInput = z.infer<
  z.ZodObject<typeof generateAssetInput>
>;

export const generateAssetDescription =
  "Make an image, speech, music, video, or sound effect file, a talking clip of a person, or a sharper copy of a picture or a video clip, with a media tool and add it as an asset. Speech gets word timings when the tool gives them; read them with get_asset_words. Speech has no length input: the length comes from the text, as a rough guide about 2.5 words for one second. The same capability, server, and input reuse the earlier file and do not call the tool again. The result gives duration_frames for audio and video, and has_audio for video. Video: width_pixels and height_pixels select a wide or tall shape, and the server picks the nearest size it supports; the result gives the real size and length. Each call costs money for each second of video. The project has a limit in seconds of generated video (limits.generatedVideoSeconds in media-tools.json, 30 by default), and a call past it returns generated-video-limit-reached. Make a still image first, check it with the person or with preview_frame, then make the video with first_frame_asset_id set to that image. Write the camera of each clip in its prompt. A film with AI video starts with set_story_plan and review_plan: no start picture or clip runs before the critic passes the plan or the check is used up, and a sheet picture needs only its cast entry with facts and sheet_prompts; each clip names its shot_id, and review_clip checks it before place_video. The first try of a sheet or a shot sends the reviewed prompt of the plan. yumekit sends the prompt as you wrote it and adds nothing: write each prompt complete, with the art direction, the look of each person and place, and the camera. Read get_shot_brief before a start picture or a clip of a shot. A picture with shot_id or cast_ids gets the sheet pictures of that cast as references. The answer gives prompt_from_you and prompt_characters. Add the video to an output with place_video. Add a sound effect to an output with place_sound. A talking clip is a video: add it with place_video, sound_gain_decibels at the level of the voice, and quiet_voice true, so the voice does not play twice.";
