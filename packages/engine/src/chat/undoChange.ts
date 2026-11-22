import type { Outcome } from "../engineTypes.js";
import type { ChangeLedger } from "./changeLedger.js";
import type { ChatLog } from "./chatLog.js";
import type { ChangeEntry, ChatFailure } from "./chatTypes.js";
import type { TrackedStore } from "./trackedStore.js";

export async function undoChangeWith(options: {
  changeId: string;
  log: ChatLog;
  ledger: ChangeLedger;
  tracked: TrackedStore;
}): Promise<Outcome<ChangeEntry, ChatFailure>> {
  const { changeId, log, ledger, tracked } = options;
  const entries = log.entries();
  const index = entries.findIndex(
    (entry) => entry.kind === "change" && entry.id === changeId,
  );
  if (index === -1) {
    return {
      ok: false,
      failure: {
        kind: "change-not-found",
        message: "The chat has no such change.",
      },
    };
  }
  let steps = 0;
  for (const entry of entries.slice(index)) {
    if (entry.kind === "change" && !entry.undone) steps += entry.undoSteps;
  }
  await tracked.runCall({
    caller: { by: "person", tool: "undo" },
    call: async () => {
      for (let step = 0; step < steps; step += 1) {
        const undone = await tracked.store.undo();
        if (!undone.ok) return;
      }
    },
  });
  const change = ledger.changeOf(changeId);
  if (change === undefined) {
    throw new Error(`The change ${changeId} left the chat during its undo.`);
  }
  return { ok: true, value: change };
}
