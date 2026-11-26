import type { Chapter, Take } from "../takes/takeSchema.js";
import "./readyLines.css";

function readyTextOf(options: { take: Take; chapters: Chapter[] }): string {
  const { take, chapters } = options;
  if (take.step === "story") return "The story is ready for you.";
  const index = chapters.findIndex((chapter) => chapter.id === take.chapterId);
  const chapter =
    chapters.length > 1 && index !== -1
      ? ` of chapter ${String(index + 1)}`
      : "";
  return `Take ${String(take.number)}${chapter} is ready for you: ${whatOf(take)} to check.`;
}

function whatOf(take: Take): string {
  const count = take.items.length;
  if (take.step === "cut") return "the cut";
  if (count === 1) return take.step === "pictures" ? "1 picture" : "1 item";
  const noun = take.step === "pictures" ? "pictures" : "clips and music";
  return `${String(count)} ${noun}`;
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
