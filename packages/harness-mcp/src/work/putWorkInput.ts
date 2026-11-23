import { z } from "zod";
import { idInput, jsonObjectInput } from "../inputs.js";
import { removePersonWorkInput } from "../timeline/personWorkInput.js";
import { wireTrack } from "../timeline/wireTimeline.js";

const workSharedCode = z.strictObject({
  name: idInput(
    "The name of the shared module. A scene imports it as ./_shared/<name>.",
  ),
  code: z
    .string()
    .min(1)
    .describe(
      "The TSX code of the module, with named exports. A module that is the frame also has a default export from defineReactScene.",
    ),
});

const workScene = z.strictObject({
  scene_id: idInput("The id of the scene. A scene with this id is replaced."),
  title: z.string().describe("A short title for a person."),
  notes: z
    .string()
    .optional()
    .describe("Optional notes: the idea of the scene."),
  kit_component: z
    .string()
    .optional()
    .describe("A kit scene from list_kit_scenes. Give kit_component or code."),
  code: z
    .string()
    .optional()
    .describe(
      "The TSX code of a custom scene. It may import the shared code of this call as ./_shared/<name>. Give kit_component or code.",
    ),
  props: jsonObjectInput.optional().describe("The props of the scene."),
});

const workTimeline = z.strictObject({
  output_id: idInput("The output of this timeline."),
  tracks: z
    .array(wireTrack)
    .describe("All tracks of the output, back to front, as in set_timeline."),
});

export const putWorkInput = {
  shared_code: z
    .array(workSharedCode)
    .optional()
    .describe(
      "Shared modules to write first: the theme, the type, the timing.",
    ),
  scenes: z
    .array(workScene)
    .optional()
    .describe("Scenes to add or replace, as in put_scene."),
  timelines: z
    .array(workTimeline)
    .optional()
    .describe("Timelines to replace, one for each output, as in set_timeline."),
  frame: z
    .union([
      idInput("A shared module of the project or of this call."),
      z.null(),
    ])
    .optional()
    .describe(
      "The shared module that the stage draws over the whole video, above the scenes and below the captions: a mark, a progress line, a margin grid. Its default export comes from defineReactScene. null removes the frame.",
    ),
  remove_person_work: removePersonWorkInput,
};

export type PutWorkInput = z.infer<z.ZodObject<typeof putWorkInput>>;
export type WorkScene = z.infer<typeof workScene>;
