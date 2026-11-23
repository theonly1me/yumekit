import type { EngineClient } from "../engine/engineClient.js";
import type { Asset } from "../engine/snapshot.js";
import { useAssetUrl } from "./useAssetUrl.js";

const shownImageCount = 6;

function Picture(props: { client: EngineClient; assetId: string | undefined }) {
  const url = useAssetUrl(props);
  return (
    <span className="first-frame-picture">
      {url === undefined ? undefined : <img src={url} alt="" />}
    </span>
  );
}

export function LastFrame(props: {
  client: EngineClient;
  assets: Asset[];
  assetId: string | undefined;
  onPick: (assetId: string | undefined) => void;
}) {
  const { client } = props;
  const images = props.assets.filter((asset) => asset.kind === "image");
  return (
    <div className="first-frame-field last-frame-field">
      <div className="first-frame">
        <Picture client={client} assetId={props.assetId} />
        <p className="fact">
          <strong>End on this picture</strong>
          {props.assetId === undefined
            ? "Optional. Pick a picture, and the clip ends on it. Two clips then join with no jump."
            : `The clip ends on the image ${props.assetId}.`}
        </p>
      </div>
      {images.length === 0 ? undefined : (
        <div
          className="frame-picks"
          role="group"
          aria-label="Pictures to end on"
        >
          <button
            type="button"
            className="frame-pick no-picture"
            aria-pressed={props.assetId === undefined}
            onClick={() => {
              props.onPick(undefined);
            }}
          >
            None
          </button>
          {images
            .slice(-shownImageCount)
            .reverse()
            .map((image) => (
              <button
                key={image.id}
                type="button"
                className="frame-pick"
                aria-pressed={image.id === props.assetId}
                aria-label={`End on ${image.id}`}
                onClick={() => {
                  props.onPick(image.id);
                }}
              >
                <Picture client={client} assetId={image.id} />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
