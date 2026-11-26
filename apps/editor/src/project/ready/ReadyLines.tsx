import {
  currentTakesOf,
  isTakeReplaced,
  replacingTakeOf,
  takeTitleInTextOf,
  takeTitleOf,
} from "@yumekit/project/takes";
import type { Chapter, Take } from "../takes/takeTypes.js";
import "./readyLines.css";

function cardTextOf(options: { take: Take; chapters: Chapter[] }): string {
  const { take } = options;
  const title = takeTitleOf(options);
  if (take.state === "open") return `${title} is being made.`;
  const count = take.items.length;
  if (take.step === "story" || take.step === "cut") {
    return `${title} is ready for you.`;
  }
  return `${title} is ready for you: ${String(count)} to check.`;
}

function replacedTextOf(options: {
  take: Take;
  takes: readonly Take[];
  chapters: Chapter[];
}): string | undefined {
  const { take, chapters } = options;
  const replacing = replacingTakeOf(options);
  if (replacing === undefined) return undefined;
  const by =
    replacing.step === take.step
      ? `take ${String(replacing.number)}`
      : takeTitleInTextOf({ take: replacing, chapters });
  return `${takeTitleOf({ take, chapters })} was replaced by ${by}.`;
}

export function ReadyLines(props: {
  takes: readonly Take[];
  chapters: Chapter[];
  onOpen: (takeId: string) => void;
}) {
  const { takes, chapters } = props;
  const replaced = takes.filter(
    (take) => take.state === "ready" && isTakeReplaced({ takes, take }),
  );
  return (
    <>
      {replaced.map((take) => (
        <li key={take.id} className="entry change take-replaced">
          <p>{replacedTextOf({ take, takes, chapters })}</p>
        </li>
      ))}
      {currentTakesOf(takes).map((take) => (
        <li
          key={take.id}
          className={`entry ai take-card ${take.state === "open" ? "take-making" : "take-ready"}`}
        >
          <span className="who">AI</span>
          <div className="answer-body">
            <p>{cardTextOf({ take, chapters })}</p>
            <button
              type="button"
              onClick={() => {
                props.onOpen(take.id);
              }}
            >
              {take.step === "story"
                ? "Read the story"
                : `Open take ${String(take.number)}`}
            </button>
          </div>
        </li>
      ))}
    </>
  );
}
