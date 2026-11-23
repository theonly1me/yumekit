import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult, successResult } from "../results.js";
import type { AskHelper, HelperChange } from "./helperTypes.js";

export const noHelperFailure = {
  kind: "no-helper",
  message:
    "This session cannot start a helper. A helper runs only inside a request of the chat of the editor.",
  hint: "Do the work yourself with the other tools.",
};

const nothingNamed = {
  kind: "helper-scope-missing",
  message:
    "ask_helper needs at least one scene id or asset id for the helper to change.",
  hint: "Give scene_ids or asset_ids: the parts that the helper may change.",
};

function changedLine(changed: HelperChange[]): string {
  return changed.length === 0
    ? "The helper changed nothing."
    : `The helper changed ${changed.map((change) => `${change.kind} ${change.id}`).join(", ")}.`;
}

function countText(options: { count: number; one: string; many: string }) {
  return `${String(options.count)} ${options.count === 1 ? options.one : options.many}`;
}

function helperWorkLine(options: { sceneIds: string[]; assetIds: string[] }) {
  const parts = [
    ...(options.sceneIds.length === 0
      ? []
      : [
          countText({
            count: options.sceneIds.length,
            one: "scene",
            many: "scenes",
          }),
        ]),
    ...(options.assetIds.length === 0
      ? []
      : [
          countText({
            count: options.assetIds.length,
            one: "file",
            many: "files",
          }),
        ]),
  ];
  return `A helper works on ${parts.join(" and ")}`;
}

export function registerAskHelper(
  context: HarnessContext & { askHelper: AskHelper | undefined },
): void {
  context.tools.add({
    name: "ask_helper",
    description:
      "Give one piece of work that stands alone to a helper agent: draw one or two scenes, or make one picture. The helper is the same agent program with a short session of its own. It gets your brief and the same tools, but it may change only the scenes and the assets that you name. It cannot export, remove what the person made, change the timeline, or start a helper. It returns its answer and the list of what it changed. Check the result with get_work or preview_scenes, and keep it or undo it. One helper runs at a time.",
    inputSchema: {
      brief: z
        .string()
        .min(1)
        .describe(
          "What the helper makes and how: the idea, the shared code to use, the look, the props, and the length. It knows only this text and what its tools show.",
        ),
      scene_ids: z
        .array(idInput("A scene that the helper may add or replace."))
        .optional()
        .describe("The scenes that the helper may add or replace."),
      asset_ids: z
        .array(idInput("An asset id that the helper may make."))
        .optional()
        .describe(
          "The asset ids that the helper may make with generate_asset.",
        ),
    },
    run: async ({ input, onProgress }) => {
      const sceneIds = input.scene_ids ?? [];
      const assetIds = input.asset_ids ?? [];
      if (context.askHelper === undefined)
        return failureResult(noHelperFailure);
      if (sceneIds.length + assetIds.length === 0) {
        return failureResult(nothingNamed);
      }
      onProgress?.({
        done: 0,
        message: helperWorkLine({ sceneIds, assetIds }),
      });
      const outcome = await context.askHelper({
        brief: input.brief,
        sceneIds,
        assetIds,
      });
      if (!outcome.ok) return failureResult(outcome.failure);
      return successResult({
        line: changedLine(outcome.changed),
        data: { text: outcome.text, changed: outcome.changed },
      });
    },
  });
}
