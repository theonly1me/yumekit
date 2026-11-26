import type { EngineClient } from "../engine/engineClient.js";
import { useAssetUrl } from "../makeClip/useAssetUrl.js";
import { startDrag } from "../scenes/dragData.js";
import type { TrayItem } from "./trayItems.js";
import "./takeTray.css";

function TrayTile(props: {
  client: EngineClient;
  item: TrayItem;
  onPlace: (item: TrayItem) => void;
}) {
  const { item } = props;
  const url = useAssetUrl({ client: props.client, assetId: item.assetId });
  const kindName = item.kind === "clip" ? "Clip" : "Picture";
  return (
    <li>
      <button
        type="button"
        className="tray-tile"
        draggable
        data-tray={item.assetId}
        data-kind={item.kind}
        aria-label={`${kindName} "${item.name}" from take ${String(item.takeNumber)}`}
        title={`${kindName} "${item.name}". Drag it onto a scene.`}
        onDragStart={(event) => {
          startDrag({ event, kind: "take-item", id: item.assetId });
        }}
        onClick={() => {
          props.onPlace(item);
        }}
      >
        {url === undefined ? undefined : item.kind === "clip" ? (
          <video src={`${url}#t=0.1`} muted preload="metadata" />
        ) : (
          <img src={url} alt="" />
        )}
        <i>{kindName}</i>
      </button>
    </li>
  );
}

export function TakeTray(props: {
  client: EngineClient;
  items: TrayItem[];
  onPlace: (item: TrayItem) => void;
}) {
  return (
    <div className="tray">
      <span className="tray-name">From Takes</span>
      {props.items.length === 0 ? (
        <p className="fact">
          Approved pictures and clips from Takes show here. Drag one onto a
          scene.
        </p>
      ) : (
        <ul className="tray-tiles" aria-label="Approved pictures and clips">
          {props.items.map((item) => (
            <TrayTile
              key={item.assetId}
              client={props.client}
              item={item}
              onPlace={props.onPlace}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
