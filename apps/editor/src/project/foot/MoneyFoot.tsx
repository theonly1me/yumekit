import { MoneyButtons, moneyLineOf } from "../../chat/money/MoneyButtons.js";
import type {
  ChatEntry,
  MoneyChoice,
  MoneyEntry,
} from "../../chat/chatSchemas.js";

export function openMoneyOf(entries: ChatEntry[]): MoneyEntry | undefined {
  const newest = entries.findLast((entry) => entry.kind === "money");
  return newest?.kind === "money" && newest.choice === null
    ? newest
    : undefined;
}

export function MoneyFoot(props: {
  entry: MoneyEntry;
  onChoose: (choice: MoneyChoice) => Promise<string | undefined>;
}) {
  return (
    <footer className="work-foot money-foot" role="alert">
      <div className="foot-words">
        <p>{moneyLineOf(props.entry)} Nothing is spent until you pick.</p>
      </div>
      <MoneyButtons
        key={props.entry.id}
        entry={props.entry}
        className="foot-actions"
        onChoose={props.onChoose}
      />
    </footer>
  );
}
