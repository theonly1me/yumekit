import { useEffect, useId, useState } from "react";
import type { PermissionAnswer, PermissionEntry } from "./permissionSchemas.js";
import { askTextOf, secondsLeftOf, waitTextOf } from "./permissionTexts.js";
import "./permissions.css";

const tickMilliseconds = 15_000;

function useSecondsLeft(entry: PermissionEntry): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, tickMilliseconds);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return secondsLeftOf({ entry, now });
}

export function PermissionCard(props: {
  entry: PermissionEntry;
  onAnswer: (answer: PermissionAnswer) => Promise<string | undefined>;
}) {
  const { entry } = props;
  const askId = useId();
  const [isSending, setSending] = useState(false);
  const [failure, setFailure] = useState<string>();
  const secondsLeft = useSecondsLeft(entry);
  const answer = (choice: PermissionAnswer) => {
    setSending(true);
    setFailure(undefined);
    props
      .onAnswer(choice)
      .then(setFailure, (error: unknown) => {
        setFailure(String(error));
      })
      .finally(() => {
        setSending(false);
      })
      .catch(() => undefined);
  };
  return (
    <section className="permission-card" aria-labelledby={askId}>
      <p className="permission-ask" id={askId}>
        {askTextOf(entry)}
      </p>
      <p className="permission-detail">{entry.detail}</p>
      {entry.folder === undefined ? undefined : (
        <p className="permission-note">
          Allow for this project adds this folder to the folders the AI may
          read. You can remove it in Settings.
        </p>
      )}
      <div className="permission-choices">
        <button
          type="button"
          className="primary"
          disabled={isSending}
          onClick={() => {
            answer("allow-once");
          }}
        >
          Allow once
        </button>
        {entry.canAllowForProject ? (
          <button
            type="button"
            disabled={isSending}
            onClick={() => {
              answer("allow-for-project");
            }}
          >
            Allow for this project
          </button>
        ) : undefined}
      </div>
      <div className="permission-foot">
        <p className="permission-wait">{waitTextOf(secondsLeft)}</p>
        <button
          type="button"
          disabled={isSending}
          onClick={() => {
            answer("deny");
          }}
        >
          Don&apos;t allow
        </button>
      </div>
      {failure === undefined ? undefined : (
        <p className="failure" role="alert">
          {failure}
        </p>
      )}
    </section>
  );
}
