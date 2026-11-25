import type { ProjectState } from "../../format/state.js";
import type { Take, TakeItem } from "../../format/takes.js";
import { succeed } from "../../outcome.js";
import type { EditOfKind } from "../edit.js";
import { problem, type EditResult } from "../editFailure.js";
import { takeOf, withTake } from "./roundTakes.js";

function earlierAssetIdsOf(options: {
  state: ProjectState;
  take: Take;
}): Set<string> {
  const { take } = options;
  return new Set(
    options.state.takes
      .filter(
        (earlier) =>
          earlier.state === "sent" &&
          earlier.chapterId === take.chapterId &&
          earlier.step === take.step,
      )
      .flatMap((earlier) => earlier.items)
      .filter((item) => item.kind === "asset")
      .map((item) => item.id),
  );
}

function approvedUnlessNoted(options: {
  item: TakeItem;
  noted: ReadonlySet<string>;
}): TakeItem {
  const { item } = options;
  return options.noted.has(item.id) ? item : { ...item, approved: true };
}

export function sendTake(options: {
  state: ProjectState;
  edit: EditOfKind<"sendTake">;
}): EditResult {
  const { state, edit } = options;
  const take = takeOf({ state, takeId: edit.takeId });
  if ("ok" in take) return take;
  if (take.state !== "ready") {
    return problem({
      kind: "invalid-value",
      message: `Take ${String(take.number)} is ${take.state}. Only a ready take can be sent.`,
    });
  }
  const earlier = earlierAssetIdsOf({ state, take });
  const unknown = edit.notes.find(
    (note) =>
      !take.items.some((item) => item.id === note.itemId) &&
      !earlier.has(note.itemId),
  );
  if (unknown !== undefined) {
    return problem({
      kind: "not-found",
      message: `A note names "${unknown.itemId}", which is not an item of take ${String(take.number)} or of an earlier take of its step.`,
    });
  }
  const noted = new Set(edit.notes.map((note) => note.itemId));
  return succeed(
    withTake({
      state,
      take: {
        ...take,
        state: "sent",
        sentAt: edit.at,
        items: take.items.map((item) => approvedUnlessNoted({ item, noted })),
        notes: edit.notes,
      },
    }),
  );
}
