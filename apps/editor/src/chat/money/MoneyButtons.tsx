import { useState } from "react";
import { dollarsText } from "../../settings/dollarsText.js";
import type { MoneyChoice, MoneyEntry } from "../chatSchemas.js";

export function moneyLineOf(entry: MoneyEntry): string {
  return `The ${entry.what} cost about ${dollarsText(entry.estimateUsd)} and ${dollarsText(entry.leftUsd)} is left.`;
}

export function MoneyButtons(props: {
  entry: MoneyEntry;
  className: string;
  onChoose: (choice: MoneyChoice) => Promise<string | undefined>;
}) {
  const { entry } = props;
  const [isSending, setSending] = useState(false);
  const [failure, setFailure] = useState<string>();
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
    <>
      <div className={props.className}>
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
    </>
  );
}
