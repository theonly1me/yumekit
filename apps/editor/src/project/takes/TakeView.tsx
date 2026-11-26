import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { ContactSheet } from "./ContactSheet.js";
import { LargeView } from "./large/LargeView.js";
import type { TakeNotes } from "./notes/useDraftNotes.js";
import { shownItemsOf } from "./shownItems.js";
import { TakeSlate, type SlateProgress } from "./TakeSlate.js";
import type { Chapter, Take } from "./takeTypes.js";
import "./media/media.css";
import "./takeView.css";

export function TakeView(props: {
  client: EngineClient;
  snapshot: Snapshot;
  take: Take;
  chapters: Chapter[];
  notes: TakeNotes;
  progress: SlateProgress | undefined;
  onPickTake: (takeId: string) => void;
}) {
  const { snapshot, take } = props;
  const [withEarlier, setWithEarlier] = useState(false);
  const [openId, setOpenId] = useState<string>();
  const own = shownItemsOf({ snapshot, take, withEarlier: false });
  const items = withEarlier
    ? shownItemsOf({ snapshot, take, withEarlier: true })
    : own;
  return (
    <div className="take-view">
      <TakeSlate
        take={take}
        takes={snapshot.takes ?? []}
        chapters={props.chapters}
        progress={props.progress}
        newCount={own.length}
        isOnlyNew={!withEarlier}
        onOnlyNew={(isOnlyNew) => {
          setWithEarlier(!isOnlyNew);
        }}
        onPickTake={props.onPickTake}
      />
      {items.length === 0 ? (
        <p className="fact lead">
          {take.state === "open"
            ? "The items of this take show here as they finish."
            : "Nothing new waits for you. Turn off the switch to see every item."}
        </p>
      ) : (
        <ContactSheet
          client={props.client}
          snapshot={snapshot}
          items={items}
          takeId={take.id}
          takeNumber={take.number}
          draft={props.notes.draft}
          onOpen={setOpenId}
        />
      )}
      {openId === undefined ? undefined : (
        <LargeView
          client={props.client}
          snapshot={snapshot}
          items={items}
          openId={openId}
          takeId={take.id}
          notes={props.notes}
          canMark={take.state !== "sent"}
          onOpen={setOpenId}
        />
      )}
    </div>
  );
}
