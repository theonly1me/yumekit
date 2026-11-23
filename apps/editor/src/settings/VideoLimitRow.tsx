import { useId, useState } from "react";
import { z } from "zod";
import type { EngineClient } from "../engine/engineClient.js";
import { failureTextOf } from "../tools/requestText.js";

const longestLimitSeconds = 3600;
const limitSchema = z.object({ generated_video_seconds: z.number() });

function usedText(options: { used: number; limit: number }): string {
  const used = Math.round(options.used * 10) / 10;
  return options.limit === 0
    ? `${String(used)} seconds used. Real video is off.`
    : `${String(used)} of ${String(options.limit)} seconds used in this project.`;
}

function draftFailure(draft: string): string | undefined {
  const seconds = Number(draft);
  if (draft.trim() === "" || !Number.isInteger(seconds)) {
    return "Write a whole number of seconds.";
  }
  return seconds < 0 || seconds > longestLimitSeconds
    ? `Use 0 to ${String(longestLimitSeconds)} seconds.`
    : undefined;
}

export function VideoLimitRow(props: {
  client: EngineClient;
  limitSeconds: number;
  usedSeconds: number;
}) {
  const fieldId = useId();
  const [draft, setDraft] = useState<string>();
  const [isSaving, setSaving] = useState(false);
  const [note, setNote] = useState<string>();
  const shown = draft ?? String(props.limitSeconds);
  const isChanged = draft !== undefined && draft !== String(props.limitSeconds);
  const failure = isChanged ? draftFailure(shown) : undefined;
  const save = () => {
    if (!isChanged || failure !== undefined || isSaving) return;
    const asked = Number(shown);
    setSaving(true);
    setNote(undefined);
    props.client
      .readJson({
        path: "/api/media/limits",
        method: "PUT",
        schema: limitSchema,
        body: { generated_video_seconds: asked },
      })
      .then((reply) => {
        if (!reply.ok) {
          setNote(`The limit did not change. ${failureTextOf(reply.failure)}`);
          return;
        }
        setDraft(undefined);
        const saved = reply.value.generated_video_seconds;
        if (saved !== asked) {
          setNote(
            `This project sets its own limit of ${String(saved)} seconds in its media-tools.json.`,
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
        Real video in each project
        <em>
          A video model stops when the project reaches this limit. 0 turns real
          video off. The change applies at once.
        </em>
      </label>
      <div className="limit-field">
        <input
          id={fieldId}
          type="number"
          inputMode="numeric"
          min={0}
          max={longestLimitSeconds}
          step={5}
          value={shown}
          aria-invalid={failure !== undefined}
          aria-describedby={`${fieldId}-used`}
          onChange={(event) => {
            setNote(undefined);
            setDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
        />
        <span>seconds</span>
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
      <p id={`${fieldId}-used`} className="limit-value">
        {usedText({ used: props.usedSeconds, limit: props.limitSeconds })}
      </p>
      {failure === undefined && note === undefined ? undefined : (
        <p className="change-failure" role="alert">
          {failure ?? note}
        </p>
      )}
    </div>
  );
}
