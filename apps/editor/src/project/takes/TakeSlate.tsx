import {
  isTakeReplaced,
  reviewCountTextOf,
  reviewCountsOf,
  reviewTotalOf,
} from "@yumekit/project/takes";
import type { Chapter, Take, TakeStep } from "./takeTypes.js";
import { takesOfChapter } from "./verdicts.js";

export interface SlateProgress {
  line: string;
  share: number | undefined;
}

const stepNames: Record<TakeStep, string> = {
  story: "The story",
  pictures: "Pictures",
  clips: "Clips and music",
  cut: "The cut",
};

function menuLabelOf(options: {
  take: Take;
  takes: readonly Take[];
  index: number;
}): string {
  const { take } = options;
  const label = `Take ${String(take.number)}, ${stepNames[take.step].toLowerCase()}`;
  if (options.index === 0) return `${label} (newest)`;
  return take.state === "sent" || !isTakeReplaced(options)
    ? label
    : `${label} (replaced)`;
}

function chapterLineOf(options: { take: Take; chapters: Chapter[] }): string {
  const { take, chapters } = options;
  const index = chapters.findIndex((chapter) => chapter.id === take.chapterId);
  const chapter = chapters[index];
  const step = `${stepNames[take.step]}.`;
  if (chapter === undefined || chapters.length < 2) return step;
  return `Chapter ${String(index + 1)}, ${chapter.title}. ${step}`;
}

function summaryOf(take: Take): string {
  const made = take.items.length;
  const remade = take.items.filter(
    (item) => item.kind === "asset" && item.replaces !== undefined,
  ).length;
  if (take.state === "sent") {
    const counts = reviewCountsOf(take.notes);
    return reviewTotalOf(counts) === 0
      ? "You approved this take."
      : `You sent this take: ${reviewCountTextOf(counts)}.`;
  }
  if (remade > 0) {
    return `The lead made ${String(remade)} again from your notes.`;
  }
  return `The lead made ${String(made)} new.`;
}

export function TakeSlate(props: {
  take: Take;
  takes: readonly Take[];
  chapters: Chapter[];
  progress: SlateProgress | undefined;
  onPickTake: (takeId: string) => void;
}) {
  const { take, progress } = props;
  const siblings =
    take.chapterId === undefined
      ? props.takes.filter((each) => each.step === take.step)
      : takesOfChapter({ takes: props.takes, chapterId: take.chapterId });
  return (
    <header className="take-slate-head">
      <div className="slate" aria-label={`Take ${String(take.number)}`}>
        <span>Take</span>
        <strong>{take.number}</strong>
      </div>
      <div className="slate-facts">
        <p>{chapterLineOf({ take, chapters: props.chapters })}</p>
        <p className="fact lead" aria-live="polite">
          {progress === undefined ? summaryOf(take) : progress.line}
        </p>
        {progress === undefined ? undefined : (
          <div
            className="progress wide"
            data-moving={progress.share === undefined}
          >
            <i style={{ width: `${String((progress.share ?? 0.4) * 100)}%` }} />
          </div>
        )}
        {siblings.length < 2 ? undefined : (
          <div className="slate-controls">
            <label className="earlier">
              <span className="hidden-label">Earlier takes</span>
              <select
                value={take.id}
                onChange={(event) => {
                  props.onPickTake(event.target.value);
                }}
              >
                {siblings.toReversed().map((...[each, index]) => (
                  <option key={each.id} value={each.id}>
                    {menuLabelOf({ take: each, takes: props.takes, index })}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    </header>
  );
}
