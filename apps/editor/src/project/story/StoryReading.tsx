import { useState } from "react";
import type { Snapshot } from "../../engine/snapshot.js";
import {
  writeQuote,
  type DraftChange,
  type ItemDraft,
} from "../takes/review/itemDrafts.js";
import type { TakeReview } from "../takes/review/useTakeReview.js";
import { SaveLine } from "../takes/rows/SaveLine.js";
import {
  scriptParagraphsOf,
  storyParagraphsOf,
  type StoryParagraph,
} from "./storyParagraphs.js";
import "./storyReading.css";

export const storyItemId = "story";

function Paragraph(props: {
  paragraph: StoryParagraph;
  draft: ItemDraft;
  canWrite: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (next: DraftChange) => void;
}) {
  const { paragraph } = props;
  const quote = props.draft.quotes.find(
    (each) => each.quote === paragraph.text,
  );
  const hasNote = quote !== undefined;
  return (
    <div
      className="story-paragraph"
      data-open={props.isOpen}
      data-has-notes={hasNote}
    >
      {paragraph.label === "" ? undefined : (
        <h3 className="story-label">{paragraph.label}</h3>
      )}
      <p onClick={props.onToggle}>{paragraph.text}</p>
      {props.isOpen || hasNote ? (
        <textarea
          className="story-comment"
          value={quote?.text ?? ""}
          rows={2}
          autoFocus={props.isOpen && !hasNote}
          disabled={!props.canWrite}
          placeholder="What should change in this paragraph?"
          aria-label="Your note on this paragraph"
          onChange={(event) => {
            props.onChange(
              writeQuote({
                id: quote?.id ?? crypto.randomUUID(),
                quote: paragraph.text,
                text: event.target.value,
              }),
            );
          }}
        />
      ) : (
        <button
          type="button"
          className="link"
          aria-expanded={false}
          onClick={props.onToggle}
        >
          Comment
        </button>
      )}
    </div>
  );
}

export function StoryReading(props: {
  snapshot: Snapshot;
  review: TakeReview;
  round: number;
}) {
  const { snapshot, review } = props;
  const [openKey, setOpenKey] = useState<string>();
  const story = snapshot.bible.story;
  if (story === undefined) {
    return (
      <div className="work-wait">
        <p className="work-title">No story yet</p>
        <p className="fact lead">
          The lead writes the whole story first. It shows here to read.
        </p>
      </div>
    );
  }
  const paragraphs = [
    ...storyParagraphsOf(story),
    ...scriptParagraphsOf(snapshot.script),
  ];
  return (
    <article className="story-reading">
      <header className="story-head">
        <p className="fact">
          The whole story and the script. Round {props.round}.
        </p>
        <h2>{snapshot.project.name}</h2>
        <p className="fact lead">
          Click a paragraph to tell the lead what to change. Your notes save as
          you type.
        </p>
        {review.saveOf(storyItemId) === undefined ? undefined : (
          <SaveLine
            save={review.saveOf(storyItemId)}
            onSaveAgain={() => {
              review.saveAgain(storyItemId);
            }}
          />
        )}
      </header>
      {paragraphs.map((paragraph) => (
        <Paragraph
          key={paragraph.key}
          paragraph={paragraph}
          draft={review.draftOf(storyItemId)}
          canWrite={review.isLoaded}
          isOpen={openKey === paragraph.key}
          onToggle={() => {
            setOpenKey(openKey === paragraph.key ? undefined : paragraph.key);
          }}
          onChange={(next) => {
            review.change({ itemId: storyItemId, next });
          }}
        />
      ))}
    </article>
  );
}
