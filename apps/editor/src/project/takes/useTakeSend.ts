import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { saveLimit } from "../../settings/limits/limitRequests.js";
import { failureTextOf } from "../../tools/requestText.js";
import { moneyShortOf, type MoneyLeft } from "../foot/moneyAction.js";
import { sentNotesOf } from "./notes/draftNotes.js";
import type { TakeNotes } from "./notes/useDraftNotes.js";
import { sendTake, type SendNext } from "./sendTake.js";
import type { Take } from "./takeSchema.js";

type Work = () => Promise<string | undefined>;

export function useTakeSend(options: {
  client: EngineClient;
  take: Take | undefined;
  notes: TakeNotes;
  money: MoneyLeft | undefined;
  onDone: () => void;
}) {
  const { client, take, notes } = options;
  const [isBusy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const sent = sentNotesOf(notes.draft);
  const short = moneyShortOf({
    take,
    noteCount: sent.length,
    money: options.money,
  });
  const run = (work: Work) => {
    setBusy(true);
    setFailure(undefined);
    work()
      .then((problem) => {
        setFailure(problem);
        if (problem !== undefined) return;
        notes.clear();
        options.onDone();
      })
      .finally(() => {
        setBusy(false);
      })
      .catch(() => undefined);
  };
  const send =
    (next: SendNext): Work =>
    async () => {
      if (take === undefined) return "No take is ready.";
      const outcome = await sendTake({
        client,
        takeId: take.id,
        notes: next === "go" ? sent : [],
        next,
      });
      return outcome.ok ? undefined : outcome.message;
    };
  const raise: Work = async () => {
    if (short !== undefined) {
      const saved = await saveLimit({
        client,
        appliesTo: "this-project",
        name: "spending_usd",
        value: short.raiseToUsd,
      });
      if (!saved.ok) return failureTextOf(saved.failure);
    }
    return send("go")();
  };
  return {
    isBusy,
    failure,
    clearFailure: () => {
      setFailure(undefined);
    },
    run,
    handlers: {
      send: () => {
        run(send("go"));
      },
      fewer: () => {
        run(send("fewer"));
      },
      "stop-here": () => {
        run(send("stop"));
      },
      raise: () => {
        run(raise);
      },
    },
  };
}
