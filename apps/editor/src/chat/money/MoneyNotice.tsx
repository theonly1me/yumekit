import { useState } from "react";
import { dollarsText } from "../../settings/dollarsText.js";
import type { MoneyChoice, MoneyEntry } from "../chatSchemas.js";
import "./moneyNotice.css";

function answerText(entry: MoneyEntry): string {
  switch (entry.choice) {
    case "raise":
      return `You raised this project to $${String(entry.raiseToUsd)}.`;
    case "fewer":
      return `You asked the lead for fewer ${entry.what}.`;
    case "stop":
      return "You stopped here. Nothing was spent.";
    case "replaced":
    case null:
      return "A newer choice about money replaced this one.";
  }
}

export function MoneyNotice(props: {
  entry: MoneyEntry;
  isNewestOpen: boolean;
  onChoose: (choice: MoneyChoice) => Promise<string | undefined>;
}) {
  const { entry } = props;
  const [isSending, setSending] = useState(false);
  const [failure, setFailure] = useState<string>();
  const line = `The ${entry.what} cost about ${dollarsText(entry.estimateUsd)} and ${dollarsText(entry.leftUsd)} is left.`;
  if (entry.choice !== null || !props.isNewestOpen) {
    return (
      <li className="entry notice money-notice" data-open="false">
        <p>
          {line} {answerText(entry)}
        </p>
      </li>
    );
  }
  const choose = (choice: MoneyChoice) => {
    setSending(true);
    setFailure(undefined);
    props
      .onChoose(choice)
      .then(setFailure, () => {
        setFailure("yumekit could not send the choice. Try again.");
      })
      .finally(() => {
        setSending(false);
      });
  };
  return (
    <li className="entry notice money-notice" data-open="true" role="alert">
      <p>{line} Nothing is spent until you pick.</p>
      <div className="notice-actions">
        <button
          type="button"
          className="primary"
          disabled={isSending}
          onClick={() => {
            choose("raise");
          }}
        >
          Raise this project to ${String(entry.raiseToUsd)}
        </button>
        {entry.callsThatFit === 0 ? undefined : (
          <button
            type="button"
            disabled={isSending}
            onClick={() => {
              choose("fewer");
            }}
          >
            Make fewer {entry.what} ({String(entry.callsThatFit)})
          </button>
        )}
        <button
          type="button"
          disabled={isSending}
          onClick={() => {
            choose("stop");
          }}
        >
          Stop here
        </button>
      </div>
      {failure === undefined ? undefined : <p className="failure">{failure}</p>}
    </li>
  );
}
