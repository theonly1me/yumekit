import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { ExportStatus } from "../../export/done/ExportStatus.js";
import { bestQuality } from "../../export/fileSize/fileSizeChoice.js";
import type { Exports } from "../../export/useExports.js";
import { isReadOnlyTake, newerTakeOf } from "../takes/newerTake.js";
import { OlderTakeLine } from "../takes/OlderTakeLine.js";
import { pickVerdict } from "../takes/review/itemDrafts.js";
import { sentDraftOf } from "../takes/review/sentDraft.js";
import type { TakeReview } from "../takes/review/useTakeReview.js";
import { ReviewRow } from "../takes/rows/ReviewRow.js";
import { shownItemsOf } from "../takes/shownItems.js";
import type { Take } from "../takes/takeTypes.js";
import "../takes/media/media.css";
import "../takes/takeView.css";
import "./film.css";

function FilmExport(props: { client: EngineClient; exports: Exports }) {
  const { entry } = props.exports;
  if (entry === undefined) return undefined;
  return (
    <section className="film-export" aria-label="The exported film">
      <ExportStatus
        client={props.client}
        entry={entry}
        progress={props.exports.progress}
        onExportAgain={() => {
          props.exports.start({
            outputIds: entry.jobs.map((job) => job.outputId),
            sharper: [],
            scale: 1,
            fileSize: bestQuality,
          });
        }}
      />
    </section>
  );
}

export function FilmView(props: {
  client: EngineClient;
  snapshot: Snapshot;
  take: Take | undefined;
  chapterLine: string;
  review: TakeReview;
  exports: Exports;
  onPickTake: (takeId: string) => void;
}) {
  const { take, snapshot, review } = props;
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
  const itemId = cut.item.id;
  const newer = newerTakeOf({ takes: snapshot.takes ?? [], take });
  const canMark = take.state === "ready" && newer === undefined;
  const isApproved = take.state === "sent" && cut.item.approved === true;
  return (
    <div className="film">
      <OlderTakeLine take={take} newer={newer} onGo={props.onPickTake} />
      <p className="film-title">{props.chapterLine}</p>
      {isApproved && newer === undefined ? (
        <FilmExport client={props.client} exports={props.exports} />
      ) : undefined}
      <ReviewRow
        client={props.client}
        snapshot={snapshot}
        shown={cut}
        takeId={take.id}
        state={{
          draft: isReadOnlyTake({ take, newer })
            ? sentDraftOf({ take, itemId })
            : review.draftOf(itemId),
          save: review.saveOf(itemId),
          canMark,
          isLoaded: !canMark || review.isLoaded,
          isInUse: false,
        }}
        onChange={(next) => {
          review.change({ itemId, next });
        }}
        onSaveAgain={() => {
          review.saveAgain(itemId);
        }}
        onOpen={() => undefined}
        onVerdict={(verdict) => {
          review.change({ itemId, next: pickVerdict(verdict) });
        }}
      />
    </div>
  );
}
