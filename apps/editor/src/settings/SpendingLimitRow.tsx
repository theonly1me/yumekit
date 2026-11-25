import { useId, useState } from "react";
import { z } from "zod";
import type { EngineClient } from "../engine/engineClient.js";
import { failureTextOf } from "../tools/requestText.js";
import { dollarsText } from "./dollarsText.js";

const largestLimitUsd = 10_000;
const nearLimitShare = 0.8;
const limitSchema = z.object({ spending_usd: z.number() });

export interface Spending {
  limitUsd: number;
  spentUsd: number;
  remainingUsd: number;
}

function draftFailure(draft: string): string | undefined {
  const usd = Number(draft);
  if (draft.trim() === "" || !Number.isFinite(usd)) {
    return "Write an amount in US dollars, for example 5 or 2.50.";
  }
  return usd < 0 || usd > largestLimitUsd
    ? `Use 0 to ${String(largestLimitUsd)} US dollars.`
    : undefined;
}

function spentText(spending: Spending): string {
  if (spending.limitUsd === 0) {
    return `${dollarsText(spending.spentUsd)} spent. Paid services are off.`;
  }
  return `About ${dollarsText(spending.spentUsd)} of ${dollarsText(spending.limitUsd)} spent in this project. ${dollarsText(spending.remainingUsd)} left.`;
}

function shareOf(spending: Spending): number {
  if (spending.limitUsd === 0) return 1;
  return Math.min(1, spending.spentUsd / spending.limitUsd);
}

export function SpendingLimitRow(props: {
  client: EngineClient;
  spending: Spending;
}) {
  const fieldId = useId();
  const { spending } = props;
  const savedText = String(spending.limitUsd);
  const [draft, setDraft] = useState<string>();
  const [isSaving, setSaving] = useState(false);
  const [note, setNote] = useState<string>();
  const shown = draft ?? savedText;
  const isChanged = draft !== undefined && draft !== savedText;
  const failure = isChanged ? draftFailure(shown) : undefined;
  const share = shareOf(spending);
  const save = () => {
    if (!isChanged || failure !== undefined || isSaving) return;
    const asked = Math.round(Number(shown) * 100) / 100;
    setSaving(true);
    setNote(undefined);
    props.client
      .readJson({
        path: "/api/media/limits",
        method: "PUT",
        schema: limitSchema,
        body: { spending_usd: asked },
      })
      .then((reply) => {
        if (!reply.ok) {
          setNote(`The limit did not change. ${failureTextOf(reply.failure)}`);
          return;
        }
        setDraft(undefined);
        if (reply.value.spending_usd !== asked) {
          setNote(
            `This project keeps its own limit of ${dollarsText(reply.value.spending_usd)}.`,
          );
        }
      })
      .catch(() => {
        setNote("The limit did not change. Try again.");
      })
      .finally(() => {
        setSaving(false);
      });
  };
  return (
    <div className="setting-row">
      <label className="setting-name" htmlFor={fieldId}>
        Money for paid services in this project
        <em>
          yumekit checks the price of each paid picture, voice, music, and video
          before it asks the service. A call that would pass this limit does not
          run. 0 turns paid services off. Only you can change it.
        </em>
      </label>
      <div className="limit-field">
        <span aria-hidden="true">US$</span>
        <input
          id={fieldId}
          type="number"
          inputMode="decimal"
          min={0}
          max={largestLimitUsd}
          step={0.5}
          value={shown}
          aria-invalid={failure !== undefined}
          aria-describedby={`${fieldId}-spent`}
          onChange={(event) => {
            setNote(undefined);
            setDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
        />
        {isChanged ? (
          <button
            type="button"
            disabled={failure !== undefined || isSaving}
            onClick={save}
          >
            {isSaving ? "Saving" : "Save"}
          </button>
        ) : undefined}
      </div>
      <div
        className="spend-meter"
        role="meter"
        aria-label="Money spent in this project"
        aria-valuemin={0}
        aria-valuemax={spending.limitUsd}
        aria-valuenow={Math.min(spending.spentUsd, spending.limitUsd)}
        data-near-limit={share >= nearLimitShare}
      >
        <span style={{ width: `${String(Math.round(share * 100))}%` }} />
      </div>
      <p id={`${fieldId}-spent`} className="limit-value">
        {spentText(spending)}
      </p>
      {failure === undefined && note === undefined ? undefined : (
        <p className="change-failure" role="alert">
          {failure ?? note}
        </p>
      )}
    </div>
  );
}
