import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { Sheet } from "../../sheets/Sheet.js";
import { NextActionBar } from "../foot/NextActionBar.js";
import { nextActionOf } from "../foot/nextAction.js";
import { latestTakeIdOf, takeCostOf } from "../work/projectFacts.js";
import { sentNotesOf } from "./notes/draftNotes.js";
import { useTakeNotes } from "./notes/useDraftNotes.js";
import { sendTake } from "./sendTake.js";
import { TakeView } from "./TakeView.js";
import type { Take } from "./takeSchema.js";
import { chaptersOf } from "./verdicts.js";

export function firstTakeToShow(takes: readonly Take[]): Take | undefined {
  return (
    takes.find((take) => take.state === "ready") ??
    takes.find((take) => take.state === "open") ??
    takes
      .toSorted((...[first, second]) =>
        first.openedAt.localeCompare(second.openedAt),
      )
      .at(-1)
  );
}

function TakeOnSheet(props: {
  client: EngineClient;
  snapshot: Snapshot;
  take: Take;
  onPick: (takeId: string | undefined) => void;
}) {
  const { client, snapshot, take } = props;
  const takes = snapshot.takes ?? [];
  const notes = useTakeNotes(take.id);
  const [failure, setFailure] = useState<string>();
  const [isBusy, setBusy] = useState(false);
  const sent = sentNotesOf(notes.draft);
  const action = nextActionOf({
    state:
      take.state === "open" ? { kind: "making", take } : { kind: "take", take },
    noteCount: sent.length,
    latestTakeId: latestTakeIdOf({ takes, take }),
    isStoryApproved: true,
    hasNextChapter: false,
    isLeadRunning: false,
    takeCost: takeCostOf({ take, snapshot }),
  });
  return (
    <>
      <TakeView
        client={client}
        snapshot={snapshot}
        take={take}
        chapters={chaptersOf(snapshot.bible.storyPlan)}
        notes={notes}
        progress={undefined}
        onPickTake={props.onPick}
      />
      <NextActionBar
        action={action}
        isBusy={isBusy}
        failure={failure}
        onAction={(id) => {
          if (id === "open-latest") {
            props.onPick(undefined);
            return;
          }
          if (id !== "send") return;
          setBusy(true);
          sendTake({ client, takeId: take.id, notes: sent })
            .then((outcome) => {
              setFailure(outcome.ok ? undefined : outcome.message);
              if (outcome.ok) notes.clear();
            })
            .finally(() => {
              setBusy(false);
            })
            .catch(() => undefined);
        }}
      />
    </>
  );
}

export function TakesSheet(props: {
  client: EngineClient;
  snapshot: Snapshot;
  takeId: string | undefined;
  onPick: (takeId: string | undefined) => void;
  onClose: () => void;
}) {
  const takes = props.snapshot.takes ?? [];
  const take =
    takes.find((candidate) => candidate.id === props.takeId) ??
    firstTakeToShow(takes);
  return (
    <Sheet titleId="takes-title" onClose={props.onClose}>
      <div className="sheet-body wide takes-sheet">
        <h2 id="takes-title">Takes</h2>
        {take === undefined ? (
          <p className="fact lead">
            No takes yet. Each round of pictures, clips, and the cut that the
            lead makes shows here.
          </p>
        ) : (
          <TakeOnSheet
            key={take.id}
            client={props.client}
            snapshot={props.snapshot}
            take={take}
            onPick={props.onPick}
          />
        )}
      </div>
    </Sheet>
  );
}
