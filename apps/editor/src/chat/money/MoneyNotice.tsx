import type { MoneyChoice, MoneyEntry } from "../chatSchemas.js";
import { MoneyButtons, moneyLineOf } from "./MoneyButtons.js";
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
  const line = moneyLineOf(entry);
  if (entry.choice !== null || !props.isNewestOpen) {
    return (
      <li className="entry notice money-notice" data-open="false">
        <p>
          {line} {answerText(entry)}
        </p>
      </li>
    );
  }
  return (
    <li className="entry notice money-notice" data-open="true" role="alert">
      <p>{line} Nothing is spent until you pick.</p>
      <MoneyButtons
        entry={entry}
        className="notice-actions"
        onChoose={props.onChoose}
      />
    </li>
  );
}
