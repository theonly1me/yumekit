import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { registerSetBible } from "./registerSetBible.js";

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

function registerAddOutput(context: HarnessContext): void {
  context.tools.add({
    name: "add_output",
    description:
      "Add an output of a custom size, for example 1280 by 720. For a platform such as YouTube, TikTok, or Instagram, call add_platform instead. An output is one deliverable with a fixed size. It starts with an empty timeline; copy_timeline fills it from another output.",
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
      "Remove one scene (scene_id) or several (scene_ids) as one change. It fails while a clip shows a scene; remove those clips first. One undo brings all of them back. put_work can also remove scenes in the same change as a new timeline.",
    inputSchema: {
      scene_id: idInput("The id of the scene to remove.").optional(),
      scene_ids: z
        .array(idInput("The id of a scene to remove."))
        .min(1)
        .max(64)
        .optional()
        .describe(
          "Several scenes to remove in one change, in place of scene_id.",
        ),
    },
    annotations: { destructiveHint: true },
    run: ({ input }) => {
      const sceneIds = [
        ...(input.scene_id === undefined ? [] : [input.scene_id]),
        ...(input.scene_ids ?? []),
      ];
      if (sceneIds.length === 0) {
        return failureResult({
          kind: "invalid-value",
          message: "remove_scene needs scene_id or scene_ids.",
          hint: "Give the id of each scene to remove. get_project lists the scenes.",
        });
      }
      return applyEditsResult({
        store: context.store,
        edits: sceneIds.map((sceneId) => ({ kind: "removeScene", sceneId })),
        line:
          sceneIds.length === 1
            ? `Scene "${sceneIds.join("")}" removed.`
            : `${String(sceneIds.length)} scenes removed as one change: ${sceneIds.join(", ")}.`,
        data: { scene_ids: sceneIds },
      });
    },
  });
}

export function registerStoryTools(context: HarnessContext): void {
  registerSetScript(context);
  registerSetBible(context);
  registerAddOutput(context);
  registerRemoveOutput(context);
  registerRemoveScene(context);
}
