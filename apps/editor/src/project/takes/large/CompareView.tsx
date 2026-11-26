import type { EngineClient } from "../../../engine/engineClient.js";
import type { Snapshot } from "../../../engine/snapshot.js";
import { shownKindOf, takeNumberOfAsset } from "../itemFacts.js";
import { useItemUrl } from "../media/useItemUrl.js";
import type { ShownItem } from "../shownItems.js";

function Column(props: {
  client: EngineClient;
  shown: ShownItem;
  takeId: string;
  label: string;
}) {
  const url = useItemUrl({
    client: props.client,
    item: props.shown.item,
    takeId: props.takeId,
  });
  const kind = shownKindOf(props.shown);
  return (
    <figure className="compare-column">
      <figcaption>{props.label}</figcaption>
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
    isNew: false,
  };
  return (
    <div className="compare-columns">
      <Column
        client={props.client}
        shown={older}
        takeId={props.takeId}
        label={`Take ${String(olderNumber ?? 1)}`}
      />
      <Column
        client={props.client}
        shown={shown}
        takeId={props.takeId}
        label={`Take ${String(shown.takeNumber)}, new`}
      />
    </div>
  );
}
