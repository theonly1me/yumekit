import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";

function registerSetScript(context: HarnessContext): void {
  context.tools.add({
    name: "set_script",
    description:
      "Replace the script of the project. The script is free text, usually the narration and the plan of each scene.",
    inputSchema: {
      script: z.string().describe("The full script. It replaces the old one."),
    },
    run: ({ input: { script } }) =>
      applyEditsResult({
        store: context.store,
        edits: [{ kind: "setScript", script }],
        line: `Script set (${String(script.length)} characters).`,
      }),
  });
}

const castMemberInput = z.strictObject({
  id: idInput("The id of the cast member."),
  name: z.string().describe("The name of the cast member."),
  description: z
    .string()
    .describe("How the cast member looks. Put it in each image prompt."),
  reference_asset_ids: z
    .array(idInput("An image asset that shows the cast member."))
    .optional()
    .describe("Image assets that show the cast member. Default none."),
});

function registerSetBible(context: HarnessContext): void {
  context.tools.add({
    name: "set_bible",
    description:
      "Replace the bible: the look and the voice that every scene and media prompt follows. Put the style in each image prompt.",
    inputSchema: {
      style: z
        .string()
        .describe(
          "The visual style in one or two sentences, for example 'flat paper cutouts, soft light'.",
        ),
      palette: z
        .array(z.string())
        .describe("Colors as CSS hex values, for example #18203a."),
      cast: z
        .array(castMemberInput)
        .optional()
        .describe("The recurring characters. Default none."),
      voice: z
        .string()
        .describe(
          "How the narration sounds, for example 'warm, calm, medium pace'.",
        ),
    },
    run: ({ input: { style, palette, cast, voice } }) =>
      applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setBible",
            bible: {
              style,
              palette,
              voice,
              cast: (cast ?? []).map((member) => ({
                id: member.id,
                name: member.name,
                description: member.description,
                referenceAssetIds: member.reference_asset_ids ?? [],
              })),
            },
          },
        ],
        line: "Bible set.",
      }),
  });
}

function registerAddOutput(context: HarnessContext): void {
  context.tools.add({
    name: "add_output",
    description:
      "Add an output: one deliverable with a fixed size, for example 1920 by 1080 for a wide video or 1080 by 1920 for a tall short. It starts with an empty timeline; copy_timeline fills it from another output.",
    inputSchema: {
      output_id: idInput("The id of the new output, for example 'tall'."),
      label: z
        .string()
        .describe("A name for a person, for example 'Short 9:16'."),
      width_pixels: z
        .int()
        .describe("Width in pixels. An even number from 16 to 7680."),
      height_pixels: z
        .int()
        .describe("Height in pixels. An even number from 16 to 7680."),
    },
    run: ({ input: { output_id, label, width_pixels, height_pixels } }) =>
      applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "addOutput",
            output: {
              id: output_id,
              label,
              widthPixels: width_pixels,
              heightPixels: height_pixels,
            },
          },
        ],
        line: `Output "${output_id}" added at ${String(width_pixels)} by ${String(height_pixels)}.`,
        hints: {
          "id-in-use": `The output "${output_id}" already exists. Choose another output_id, or call get_project to see the outputs.`,
        },
      }),
  });
}

function registerRemoveOutput(context: HarnessContext): void {
  context.tools.add({
    name: "remove_output",
    description: "Remove an output and its timeline. undo brings it back.",
    inputSchema: { output_id: idInput("The id of the output to remove.") },
    annotations: { destructiveHint: true },
    run: ({ input: { output_id } }) =>
      applyEditsResult({
        store: context.store,
        edits: [{ kind: "removeOutput", outputId: output_id }],
        line: `Output "${output_id}" removed.`,
      }),
  });
}

function registerRemoveScene(context: HarnessContext): void {
  context.tools.add({
    name: "remove_scene",
    description:
      "Remove a scene. It fails while a clip shows the scene; remove those clips first. undo brings it back.",
    inputSchema: { scene_id: idInput("The id of the scene to remove.") },
    annotations: { destructiveHint: true },
    run: ({ input: { scene_id } }) =>
      applyEditsResult({
        store: context.store,
        edits: [{ kind: "removeScene", sceneId: scene_id }],
        line: `Scene "${scene_id}" removed.`,
      }),
  });
}

export function registerStoryTools(context: HarnessContext): void {
  registerSetScript(context);
  registerSetBible(context);
  registerAddOutput(context);
  registerRemoveOutput(context);
  registerRemoveScene(context);
}
