import {
  openTakeOf,
  takeStepNames,
  type Asset,
  type TakeItem,
} from "@yumekit/project";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import { centsOf } from "../storyPlan/planCost.js";
import { nextStepEstimateOf } from "./nextStepEstimate.js";
import { readyItemsOf, readyTakeInput } from "./readyTakeItems.js";
import { countOf } from "./takeNoteText.js";

function dollars(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

function costOf(options: { items: TakeItem[]; assets: Asset[] }): number {
  return centsOf(
    options.items.reduce((...[total, item]) => {
      const asset = options.assets.find(
        (candidate) => item.kind === "asset" && candidate.id === item.id,
      );
      const cost =
        asset?.source.kind === "tool" ? (asset.source.costUsd ?? 0) : 0;
      return total + cost;
    }, 0),
  );
}

export function registerReadyTake(context: HarnessContext): void {
  context.tools.add({
    name: "ready_take",
    description:
      "Give the open take to the person. Give your honest note on each item (what it shows, and the fault that you see or suspect), what_to_check for each clip, music, and cut (you cannot watch motion or hear sound), and leave_out for an asset that the person does not need. The harness stores the cost of the take and the estimate of the next step. Then end your turn at once, with one short line that the take is ready: the person marks only what needs a change, and each item with no note counts as approved. The notes come back as the next request.",
    inputSchema: readyTakeInput,
    run: async ({ input }) => {
      const snapshot = context.store.read();
      const take = openTakeOf(snapshot.takes);
      if (take === undefined) {
        return failureResult({
          kind: "no-open-take",
          message: "No take is open.",
          hint: "Call open_take before the work of a round, then ready_take after it.",
        });
      }
      const items = readyItemsOf({ take, snapshot, input });
      if (!items.ok) return failureResult(items.failure);
      const costUsd = costOf({ items: items.value, assets: snapshot.assets });
      const estimate = await nextStepEstimateOf({
        snapshot,
        mediaTools: context.mediaTools,
        take,
        given: input.next_step_estimate_usd,
      });
      const estimateText =
        estimate === undefined
          ? ""
          : ` The next step costs about ${dollars(estimate)}.`;
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "readyTake",
            takeId: take.id,
            items: items.value,
            at: new Date().toISOString(),
            costUsd,
            ...(estimate === undefined
              ? {}
              : { nextStepEstimateUsd: estimate }),
          },
        ],
        line: `Take ${String(take.number)} of ${takeStepNames[take.step]} is ready for the person: ${countOf({ count: items.value.length, word: "item" })} for ${dollars(costUsd)}.${estimateText} End your turn now with one short line that take ${String(take.number)} is ready. The notes of the person come back as the next request.`,
        data: {
          take_id: take.id,
          number: take.number,
          items: items.value.length,
          cost_usd: costUsd,
          ...(estimate === undefined
            ? {}
            : { next_step_estimate_usd: estimate }),
        },
      });
    },
  });
}
