import { useState } from "react";

export interface LimitUnit {
  word: "dollars" | "seconds";
  step: number;
  largest: number;
  isWhole: boolean;
}

export const dollarsUnit: LimitUnit = {
  word: "dollars",
  step: 5,
  largest: 10_000,
  isWhole: false,
};

export const secondsUnit: LimitUnit = {
  word: "seconds",
  step: 10,
  largest: 3600,
  isWhole: true,
};

function draftFailure(options: {
  draft: string;
  unit: LimitUnit;
}): string | undefined {
  const { draft, unit } = options;
  const value = Number(draft);
  if (draft.trim() === "" || !Number.isFinite(value)) {
    return unit.isWhole
      ? "Write a whole number of seconds."
      : "Write an amount in US dollars, for example 5 or 2.50.";
  }
  if (unit.isWhole && !Number.isInteger(value)) {
    return "Write a whole number of seconds.";
  }
  return value < 0 || value > unit.largest
    ? `Use 0 to ${String(unit.largest)} ${unit.word}.`
    : undefined;
}

function shownOf(options: { value: number; unit: LimitUnit }): string {
  const { value } = options;
  if (options.unit.isWhole) return String(value);
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function LimitStepper(props: {
  name: string;
  value: number;
  unit: LimitUnit;
  onSave: (value: number) => Promise<string | undefined>;
}) {
  const { unit, value } = props;
  const [draft, setDraft] = useState<string>();
  const [isSaving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string>();
  const save = (next: number) => {
    if (next === value) {
      setDraft(undefined);
      return;
    }
    setSaving(true);
    props
      .onSave(Math.round(next * 100) / 100)
      .then(
        (saveFailure) => {
          setFailure(
            saveFailure === undefined
              ? undefined
              : `The limit did not change. ${saveFailure}`,
          );
          if (saveFailure === undefined) setDraft(undefined);
        },
        () => {
          setFailure("The limit did not change. Try again.");
        },
      )
      .finally(() => {
        setSaving(false);
      });
  };
  const saveDraft = () => {
    if (draft === undefined) return;
    const draftProblem = draftFailure({ draft, unit });
    setFailure(draftProblem);
    if (draftProblem === undefined) save(Number(draft));
  };
  const lower = Math.max(
    0,
    Math.ceil(value / unit.step) * unit.step - unit.step,
  );
  const higher = Math.min(
    unit.largest,
    Math.floor(value / unit.step) * unit.step + unit.step,
  );
  return (
    <div className="limit-control">
      <span className="stepper">
        <button
          type="button"
          aria-label={`${String(unit.step)} ${unit.word} less`}
          disabled={isSaving || value <= 0}
          onClick={() => {
            save(lower);
          }}
        >
          -
        </button>
        <span className="limit-amount">
          {unit.word === "dollars" ? (
            <span aria-hidden="true">$</span>
          ) : undefined}
          <input
            type="text"
            inputMode={unit.isWhole ? "numeric" : "decimal"}
            aria-label={props.name}
            aria-invalid={failure !== undefined}
            size={Math.max(1, (draft ?? shownOf({ value, unit })).length)}
            value={draft ?? shownOf({ value, unit })}
            disabled={isSaving}
            onChange={(event) => {
              setFailure(undefined);
              setDraft(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveDraft();
            }}
            onBlur={saveDraft}
          />
          {unit.word === "seconds" ? (
            <span className="limit-unit">seconds</span>
          ) : undefined}
        </span>
        <button
          type="button"
          aria-label={`${String(unit.step)} ${unit.word} more`}
          disabled={isSaving || value >= unit.largest}
          onClick={() => {
            save(higher);
          }}
        >
          +
        </button>
      </span>
      {failure === undefined ? undefined : (
        <p className="change-failure" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}
