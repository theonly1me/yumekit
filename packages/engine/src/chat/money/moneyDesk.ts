import { randomUUID } from "node:crypto";
import type { Outcome } from "../../engineTypes.js";
import type { Chat } from "../chatInterface.js";
import type { ChatLog } from "../chatLog.js";
import type { ChatFailure, MoneyChoice, MoneyEntry } from "../chatTypes.js";
import { choiceRequestOf, type MoneyWarning } from "./moneyWarning.js";

export interface MoneyDesk {
  warn: (warning: MoneyWarning) => MoneyEntry;
  openEntry: (id: string) => MoneyEntry | undefined;
  answer: (options: {
    entry: MoneyEntry;
    choice: MoneyChoice;
  }) => Promise<Outcome<MoneyEntry, ChatFailure>>;
}

function notOpen(message: string): { ok: false; failure: ChatFailure } {
  return { ok: false, failure: { kind: "money-warning-not-open", message } };
}

export function createMoneyDesk(options: {
  log: ChatLog;
  startRequest: Chat["startRequest"];
}): MoneyDesk {
  const { log } = options;
  const openEntry = (id: string) =>
    log
      .entries()
      .find(
        (entry): entry is MoneyEntry =>
          entry.kind === "money" && entry.id === id && entry.choice === null,
      );
  return {
    warn: (warning) => {
      for (const open of log.entries()) {
        if (open.kind === "money" && open.choice === null) {
          log.put({ ...open, choice: "replaced" });
        }
      }
      const entry: MoneyEntry = {
        kind: "money",
        id: randomUUID(),
        ...warning,
        choice: null,
      };
      log.put(entry);
      return entry;
    },
    openEntry,
    answer: async ({ entry, choice }) => {
      if (openEntry(entry.id) === undefined) {
        return notOpen("This choice about money is already made.");
      }
      if (choice === "fewer" && entry.callsThatFit === 0) {
        return notOpen("Nothing of this batch fits in the money left.");
      }
      const answered: MoneyEntry = { ...entry, choice };
      log.put(answered);
      if (choice === "stop") return { ok: true, value: answered };
      const started = await options.startRequest({
        text: choiceRequestOf({ entry, choice }),
        aboutClipId: undefined,
      });
      if (!started.ok) {
        log.put({
          kind: "notice",
          id: randomUUID(),
          text: started.failure.message,
        });
      }
      return { ok: true, value: answered };
    },
  };
}
