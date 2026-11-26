import type { EngineClient } from "../../../engine/engineClient.js";
import type { Snapshot } from "../../../engine/snapshot.js";
import { shownKindOf, takeNumberOfAsset } from "../itemFacts.js";
import { useItemUrl } from "../media/useItemUrl.js";
import type { Picks } from "../review/picks.js";
import { UseButton } from "../rows/UseRow.js";
import type { ShownItem } from "../shownItems.js";

function Column(props: {
  client: EngineClient;
  shown: ShownItem;
  takeId: string;
  label: string;
  picks: Picks;
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
        <UseButton
          isPicked={props.picks.isPicked(itemId)}
          canPick={props.picks.canPick}
          onUse={() => {
            props.picks.toggle(itemId);
          }}
        />
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
        label={`Take ${String(olderNumber ?? 1)}`}
      />
      <Column
        client={props.client}
        shown={shown}
        takeId={props.takeId}
        picks={props.picks}
        label={`Take ${String(shown.takeNumber)}, new`}
      />
    </div>
  );
}
