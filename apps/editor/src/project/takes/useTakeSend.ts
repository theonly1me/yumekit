import { reviewTotalOf } from "@yumekit/project/takes";
import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { saveLimit } from "../../settings/limits/limitRequests.js";
import { failureTextOf } from "../../tools/requestText.js";
import { moneyShortOf, type MoneyLeft } from "../foot/moneyAction.js";
import { draftCountsOf, sentNotesOf } from "./review/sentNotes.js";
import type { TakeReview } from "./review/useTakeReview.js";
import { sendTake, type SendNext } from "./sendTake.js";
import type { Take } from "./takeTypes.js";

type Work = () => Promise<string | undefined>;

export function useTakeSend(options: {
  client: EngineClient;
  take: Take | undefined;
  review: TakeReview;
  itemIds: readonly string[];
  money: MoneyLeft | undefined;
  onDone: () => void;
}) {
  const { client, take, review } = options;
  const [isBusy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const drafts = { drafts: review.drafts, itemIds: options.itemIds };
  const counts = draftCountsOf(drafts);
  const short = moneyShortOf({
    take,
    noteCount: reviewTotalOf(counts),
    money: options.money,
  });
  const run = (work: Work) => {
    setBusy(true);
    setFailure(undefined);
    work()
      .then(async (problem) => {
        setFailure(problem);
        if (problem !== undefined) return;
        await review.forget({ onEngine: take === undefined });
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
      await review.flush();
      const outcome = await sendTake({
        client,
        takeId: take.id,
        notes: sentNotesOf(drafts),
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
    counts,
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
