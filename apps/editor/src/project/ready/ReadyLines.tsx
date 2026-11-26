import { takeTitleOf } from "@yumekit/project/takes";
import type { Chapter, Take } from "../takes/takeTypes.js";
import "./readyLines.css";

function readyTextOf(options: { take: Take; chapters: Chapter[] }): string {
  const { take } = options;
  const title = takeTitleOf(options);
  const count = take.items.length;
  if (take.step === "story" || take.step === "cut") {
    return `${title} is ready for you.`;
  }
  return `${title} is ready for you: ${String(count)} to check.`;
}

export function ReadyLines(props: {
  takes: readonly Take[];
  chapters: Chapter[];
  onOpen: (takeId: string) => void;
}) {
  const ready = props.takes.filter((take) => take.state === "ready");
  return ready.map((take) => (
    <li key={take.id} className="entry ai take-ready">
      <span className="who">AI</span>
      <div className="answer-body">
        <p>{readyTextOf({ take, chapters: props.chapters })}</p>
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
  ));
}
