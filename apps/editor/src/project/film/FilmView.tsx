import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { MediaStage } from "../takes/media/MediaStage.js";
import { NoteList } from "../takes/notes/NoteList.js";
import type { TakeNotes } from "../takes/notes/useDraftNotes.js";
import { shownItemsOf } from "../takes/shownItems.js";
import type { Take } from "../takes/takeSchema.js";
import "../takes/media/media.css";
import "./film.css";

export function FilmView(props: {
  client: EngineClient;
  snapshot: Snapshot;
  take: Take | undefined;
  chapterLine: string;
  notes: TakeNotes;
}) {
  const { take, snapshot } = props;
  const [focusId, setFocusId] = useState<string>();
  const cut =
    take === undefined
      ? undefined
      : shownItemsOf({ snapshot, take, withEarlier: false }).find(
          (shown) => shown.item.kind === "cut",
        );
  if (take === undefined || cut === undefined) {
    return (
      <div className="work-wait">
        <p className="work-title">No cut yet</p>
        <p className="fact lead">
          The lead puts the chapter together when you approve its clips.
        </p>
      </div>
    );
  }
  const canMark = take.state === "ready";
  const check = cut.item.kind === "cut" ? cut.item.whatToCheck : undefined;
  return (
    <div className="film">
      <p className="film-title">{props.chapterLine}</p>
      <MediaStage
        client={props.client}
        shown={cut}
        takeId={take.id}
        notes={props.notes}
        framesPerSecond={snapshot.project.framesPerSecond}
        canMark={canMark}
        onNoteAdded={setFocusId}
      />
      {cut.item.note === undefined ? undefined : (
        <p className="lead-note">
          <span>The lead</span>
          {cut.item.note}
        </p>
      )}
      {check === undefined ? undefined : (
        <p className="check-line">
          <span>What to check</span>
          {check}
        </p>
      )}
      {canMark ? (
        <NoteList
          notes={props.notes}
          itemId={cut.item.id}
          focusId={focusId}
          hint="Mark a moment while it plays, or write a note."
        />
      ) : undefined}
    </div>
  );
}
