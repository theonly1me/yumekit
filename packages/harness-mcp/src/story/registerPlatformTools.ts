import { platformCatalog, platformIds, platformOf } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { failureResult, successResult } from "../results.js";
import { addPlatformPlan, removePlatformPlan } from "./platformEdits.js";

const catalogText = platformCatalog
  .map(
    (platform) =>
      `"${platform.id}" (${platform.name}, ${String(platform.widthPixels)} by ${String(platform.heightPixels)})`,
  )
  .join(", ");

const platformIdInput = z
  .enum(platformIds)
  .describe(`The id of the platform. One of ${catalogText}.`);

function registerAddPlatform(context: HarnessContext): void {
  context.tools.add({
    name: "add_platform",
    description:
      "Add a platform where the person publishes, for example YouTube or TikTok. Platforms with the same size share one output, so one render serves them all. If no output has the size of the platform, the tool adds the output and copies the timeline of the output with the nearest shape. Use add_output only for a custom size. One call is one undo step.",
    inputSchema: { platform_id: platformIdInput },
    run: ({ input: { platform_id } }) => {
      const plan = addPlatformPlan({
        snapshot: context.store.read(),
        platformId: platform_id,
      });
      if (plan.kind === "already-added") {
        return successResult({
          line: `${platformOf(platform_id).name} is already on the output "${plan.outputId}". Nothing changed.`,
          data: {
            output_id: plan.outputId,
            revision: context.store.read().revision,
          },
        });
      }
      return applyEditsResult({
        store: context.store,
        edits: plan.edits,
        line: plan.line,
        hints: {
          "id-in-use": `An output with the id "${platformOf(platform_id).outputId}" has another size. Remove it with remove_output, or call get_project to see the outputs.`,
        },
      });
    },
  });
}

function registerRemovePlatform(context: HarnessContext): void {
  context.tools.add({
    name: "remove_platform",
    description:
      "Remove a platform. When no other platform uses its output and the project has another output, the tool also removes the output and its timeline. One call is one undo step; undo brings it back.",
    inputSchema: { platform_id: platformIdInput },
    annotations: { destructiveHint: true },
    run: ({ input: { platform_id } }) => {
      const plan = removePlatformPlan({
        snapshot: context.store.read(),
        platformId: platform_id,
      });
      if (plan === undefined) {
        return failureResult({
          kind: "not-found",
          message: `No output has the platform "${platform_id}".`,
          hint: "Call get_project to see the platforms of each output.",
        });
      }
      return applyEditsResult({
        store: context.store,
        edits: plan.edits,
        line: plan.line,
      });
    },
  });
}

export function registerPlatformTools(context: HarnessContext): void {
  registerAddPlatform(context);
  registerRemovePlatform(context);
}
