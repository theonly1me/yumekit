import { useState } from "react";
import type { Snapshot } from "../../engine/snapshot.js";
import { notesOfItem } from "../takes/notes/draftNotes.js";
import type { TakeNotes } from "../takes/notes/useDraftNotes.js";
import {
  scriptParagraphsOf,
  storyParagraphsOf,
  type StoryParagraph,
} from "./storyParagraphs.js";
import "./storyReading.css";

export const storyItemId = "story";

function Paragraph(props: {
  paragraph: StoryParagraph;
  notes: TakeNotes;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { paragraph, notes } = props;
  const [words, setWords] = useState("");
  const own = notesOfItem({ draft: notes.draft, itemId: storyItemId }).filter(
    (note) =>
      note.place.kind === "quote" && note.place.quote === paragraph.text,
  );
  return (
    <div
      className="story-paragraph"
      data-open={props.isOpen}
      data-has-notes={own.length > 0}
    >
      {paragraph.label === "" ? undefined : (
        <h3 className="story-label">{paragraph.label}</h3>
      )}
      <p onClick={props.onToggle}>{paragraph.text}</p>
      <button
        type="button"
        className="link"
        aria-expanded={props.isOpen}
        onClick={props.onToggle}
      >
        {own.length === 0
          ? "Comment"
          : `${String(own.length)} ${own.length === 1 ? "comment" : "comments"}`}
      </button>
      {own.length === 0 ? undefined : (
        <ul className="story-notes">
          {own.map((note) => (
            <li key={note.id}>
              {note.text}{" "}
              <button
                type="button"
                className="remove"
                onClick={() => {
                  notes.remove(note.id);
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {props.isOpen ? (
        <form
          className="note-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (words.trim() === "") return;
            notes.add({
              itemId: storyItemId,
              place: { kind: "quote", quote: paragraph.text },
              text: words.trim(),
            });
            setWords("");
            props.onToggle();
          }}
        >
          <input
            type="text"
            value={words}
            autoFocus
            placeholder="What should change in this paragraph?"
            aria-label="Your note on this paragraph"
            onChange={(event) => {
              setWords(event.target.value);
            }}
          />
          <button type="submit">Add</button>
        </form>
      ) : undefined}
    </div>
  );
}

export function StoryReading(props: {
  snapshot: Snapshot;
  notes: TakeNotes;
  round: number;
}) {
  const { snapshot } = props;
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
          Click a paragraph to tell the lead what to change.
        </p>
      </header>
      {paragraphs.map((paragraph) => (
        <Paragraph
          key={paragraph.key}
          paragraph={paragraph}
          notes={props.notes}
          isOpen={openKey === paragraph.key}
          onToggle={() => {
            setOpenKey(openKey === paragraph.key ? undefined : paragraph.key);
          }}
        />
      ))}
    </article>
  );
}
