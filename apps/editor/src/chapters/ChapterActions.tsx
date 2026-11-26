import { useState } from "react";
import type { ChapterEdits } from "./chapterEdits.js";
import type { ChapterCard, FilmChapter } from "./filmChapters.js";

export function ChapterActions(props: {
  chapter: FilmChapter;
  isLast: boolean;
  pickedCard: { card: ChapterCard; title: string } | undefined;
  edits: ChapterEdits;
  onOpenTakes: (chapterId: string) => void;
}) {
  const { chapter, edits, pickedCard } = props;
  const [isRenaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(chapter.title);
  const [firstCard] = chapter.cards;
  const splitAt =
    pickedCard?.card.chapterId === chapter.id &&
    pickedCard.card.shotId !== undefined &&
    pickedCard.card.clip.id !== firstCard?.clip.id
      ? pickedCard
      : undefined;
  const number = String(chapter.number);
  return (
    <div
      className="chapter-actions"
      role="group"
      aria-label={`Actions for chapter ${number}`}
    >
      <p className="scene-actions-name">
        Chapter {number}: {chapter.title}
      </p>
      {isRenaming ? (
        <form
          className="rename-form"
          onSubmit={(event) => {
            event.preventDefault();
            setRenaming(false);
            edits.rename({ chapterId: chapter.id, title });
          }}
        >
          <input
            type="text"
            aria-label={`Name of chapter ${number}`}
            value={title}
            maxLength={80}
            autoFocus
            onFocus={(event) => {
              event.currentTarget.select();
            }}
            onChange={(event) => {
              setTitle(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              setRenaming(false);
              setTitle(chapter.title);
            }}
          />
          <button type="submit" className="primary">
            Save
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setRenaming(true);
          }}
        >
          Rename
        </button>
      )}
      <button
        type="button"
        disabled={splitAt === undefined}
        title={
          splitAt === undefined ? "Pick a scene of this chapter first" : ""
        }
        onClick={() => {
          if (splitAt === undefined) return;
          edits.split({
            chapterId: chapter.id,
            card: splitAt.card,
            sceneTitle: splitAt.title,
          });
        }}
      >
        {splitAt === undefined
          ? "Split at a scene"
          : `Split at "${splitAt.title}"`}
      </button>
      <button
        type="button"
        disabled={props.isLast}
        onClick={() => {
          edits.join(chapter.id);
        }}
      >
        Join with chapter {chapter.number + 1}
      </button>
      <button
        type="button"
        onClick={() => {
          props.onOpenTakes(chapter.id);
        }}
      >
        Open its takes
      </button>
    </div>
  );
}
