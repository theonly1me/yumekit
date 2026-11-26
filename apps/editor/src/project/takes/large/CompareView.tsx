import type { EngineClient } from "../../../engine/engineClient.js";
import type { Snapshot } from "../../../engine/snapshot.js";
import { shownKindOf, takeNumberOfAsset } from "../itemFacts.js";
import { useItemUrl } from "../media/useItemUrl.js";
import type { Picks } from "../review/picks.js";
import type { DraftVerdict } from "../review/itemDrafts.js";
import type { ShownItem } from "../shownItems.js";

function Column(props: {
  client: EngineClient;
  shown: ShownItem;
  takeId: string;
  label: string;
  picks: Picks;
  verdictOf: (itemId: string) => DraftVerdict | undefined;
}) {
  const itemId = props.shown.item.id;
  const url = useItemUrl({
    client: props.client,
    item: props.shown.item,
    takeId: props.takeId,
  });
  const kind = shownKindOf(props.shown);
  return (
    <figure className="compare-column">
      <figcaption>
        {props.label}
        {props.picks.inUseIds.has(itemId) ? (
          <span className="badge in-use">In use</span>
        ) : undefined}
        <button
          type="button"
          className="looks-right"
          aria-pressed={props.verdictOf(itemId) === "approved"}
          disabled={!props.picks.canPick}
          onClick={() => {
            props.picks.lookRight(itemId);
          }}
        >
          Looks right
        </button>
      </figcaption>
      <div className="stage-box">
        {url === undefined ? undefined : kind === "picture" ? (
          <img src={url} alt={props.label} />
        ) : (
          <video src={url} controls playsInline />
        )}
      </div>
    </figure>
  );
}

export function CompareView(props: {
  client: EngineClient;
  snapshot: Snapshot;
  shown: ShownItem;
  olderId: string;
  takeId: string;
  picks: Picks;
  verdictOf: (itemId: string) => DraftVerdict | undefined;
}) {
  const { snapshot, shown } = props;
  const olderNumber = takeNumberOfAsset({
    takes: snapshot.takes ?? [],
    assetId: props.olderId,
  });
  const older: ShownItem = {
    ...shown,
    item: { kind: "asset", id: props.olderId },
    asset: snapshot.assets.find((asset) => asset.id === props.olderId),
    origin: "approved",
  };
  return (
    <div className="compare-columns">
      <Column
        client={props.client}
        shown={older}
        takeId={props.takeId}
        picks={props.picks}
        verdictOf={props.verdictOf}
        label={`Take ${String(olderNumber ?? 1)}`}
      />
      <Column
        client={props.client}
        shown={shown}
        takeId={props.takeId}
        picks={props.picks}
        verdictOf={props.verdictOf}
        label={`Take ${String(shown.takeNumber)}, new`}
      />
    </div>
  );
}
