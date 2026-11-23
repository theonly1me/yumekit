import { cameraMoveIds } from "@yumekit/project";
import { z } from "zod";
import { idInput, jsonObjectInput } from "../inputs.js";

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
  camera_move: z
    .string()
    .optional()
    .describe(
      `A named camera move for a video. The harness adds a tested sentence for the move to the end of the prompt, so do not describe the camera move in the prompt too. The ids: ${cameraMoveIds.join(", ")}. get_scene_guide gives one line for each.`,
    ),
};

export type GenerateAssetInput = z.infer<
  z.ZodObject<typeof generateAssetInput>
>;

export const generateAssetDescription =
  "Make an image, speech, music, video, or sound effect file, a talking clip of a person, or a sharper copy of a picture or a video clip, with a media tool and add it as an asset. Speech gets word timings when the tool gives them; read them with get_asset_words. Speech has no length input: the length comes from the text, as a rough guide about 2.5 words for one second. The same capability, server, and input reuse the earlier file and do not call the tool again. The result gives duration_frames for audio and video, and has_audio for video. Video: width_pixels and height_pixels select a wide or tall shape, and the server picks the nearest size it supports; the result gives the real size and length. Each call costs money for each second of video. The project has a limit in seconds of generated video (limits.generatedVideoSeconds in media-tools.json, 30 by default), and a call past it returns generated-video-limit-reached. Make a still image first, check it with the person or with preview_frame, then make the video with first_frame_asset_id set to that image. Pick a camera_move for each clip. Add the video to an output with place_video. Add a sound effect to an output with place_sound. A talking clip is a video: add it with place_video, sound_gain_decibels at the level of the voice, and quiet_voice true, so the voice does not play twice.";
