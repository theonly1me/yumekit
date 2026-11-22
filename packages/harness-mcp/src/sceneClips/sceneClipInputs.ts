import { z } from "zod";
import { idInput } from "../inputs.js";

export const outputIdsInput = z
  .array(idInput("The id of an output."))
  .min(1)
  .optional()
  .describe(
    "The outputs to change. Default: each output that has a clip with clip_id on its scenes row. copy_timeline keeps clip ids, so one clip id names the same scene clip in each output.",
  );

export const sceneClipIdInput = idInput(
  "The id of a clip on the scenes row, from get_timeline. The scenes row is the first scene track that is not a caption track.",
);

export const sceneClipToolNote =
  "Only the clips of the scenes row move. The voice, the music, the video sound, and the captions keep their places, so the result has voice_may_not_match true when a changed output has a voice clip (an audio clip of an asset with word timings). Then fit the voice again, for example with place_narration. One undo reverts the change in each output.";
