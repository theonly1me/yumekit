import { z } from "zod";

export const removePersonWorkInput = z
  .boolean()
  .optional()
  .describe(
    "true permits the call to remove or replace what the person made: a file, a video clip, a scene, or a transition. Give it only when the person asked for that removal in this request. Without it, such a call fails with would-remove-the-work-of-the-person and lists what it would remove.",
  );

export const personWorkSentence =
  "When the call would remove or replace what the person made (a music or voice file, a video clip, a scene, or a transition), it fails with would-remove-the-work-of-the-person and lists each thing, unless remove_person_work is true.";
