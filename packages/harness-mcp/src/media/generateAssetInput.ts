import { cameraMoveIds } from "@yumekit/project";
import { z } from "zod";
import { idInput, jsonObjectInput } from "../inputs.js";

export const toolNameByCapability = {
  image: "generate_image",
  speech: "generate_speech",
  music: "generate_music",
  video: "generate_video",
} as const;

export const generateAssetInput = {
  asset_id: idInput(
    "The id of the new asset, for example 'narration-intro' or 'hero-image'.",
  ),
  capability: z
    .enum(["image", "speech", "music", "video"])
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
    "The input of the media tool, with snake_case names and time in seconds. image: prompt (required), width_pixels, height_pixels, transparent_background. speech: text (required), voice, instructions, speed. music: prompt and duration_seconds (both required). video: prompt and duration_seconds (both required), width_pixels, height_pixels, with_audio (default true). The harness adds output_directory and file_stem. Give reference images, a first frame, and a last frame as asset ids in the fields below, not as paths.",
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
  "Make an image, speech, music, or video file with a media tool and add it as an asset. Speech gets word timings when the tool gives them; read them with get_asset_words. Speech has no length input: the length comes from the text, as a rough guide about 2.5 words for one second. The same capability, server, and input reuse the earlier file and do not call the tool again. The result gives duration_frames for audio and video, and has_audio for video. Video: width_pixels and height_pixels select a wide or tall shape, and the server picks the nearest size it supports; the result gives the real size and length. Each call costs money for each second of video. The project has a limit in seconds of generated video (limits.generatedVideoSeconds in media-tools.json, 30 by default), and a call past it returns generated-video-limit-reached. Make a still image first, check it with the person or with preview_frame, then make the video with first_frame_asset_id set to that image. Pick a camera_move for each clip. Add the video to an output with place_video.";
