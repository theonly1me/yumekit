import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Asset } from "../../engine/snapshot.js";
import { useAssetUrl } from "../../makeClip/useAssetUrl.js";

function StartPicture(props: {
  client: EngineClient;
  asset: Asset;
  label: string;
}) {
  const url = useAssetUrl({ client: props.client, assetId: props.asset.id });
  return (
    <span className="file-thumb shot-thumb">
      {url === undefined ? undefined : <img src={url} alt={props.label} />}
    </span>
  );
}

function LoadedClip(props: {
  client: EngineClient;
  asset: Asset;
  label: string;
}) {
  const url = useAssetUrl({ client: props.client, assetId: props.asset.id });
  return url === undefined ? (
    <span className="fact">Loading</span>
  ) : (
    <video src={url} aria-label={props.label} autoPlay controls playsInline />
  );
}

function Clip(props: { client: EngineClient; asset: Asset; label: string }) {
  const [isLoaded, setLoaded] = useState(false);
  return (
    <span className="file-thumb shot-thumb" data-kind="video">
      {isLoaded ? (
        <LoadedClip {...props} />
      ) : (
        <button
          type="button"
          className="play-sound"
          aria-label={`Play ${props.label}`}
          onClick={() => {
            setLoaded(true);
          }}
        >
          Play
        </button>
      )}
    </span>
  );
}

export function ShotPictures(props: {
  client: EngineClient;
  number: number;
  startPicture: Asset | undefined;
  endPicture: Asset | undefined;
  clip: Asset | undefined;
}) {
  const { client, number } = props;
  const picture = props.startPicture ?? props.endPicture;
  const pictureName =
    props.startPicture === undefined
      ? "The last kept picture"
      : "The start picture";
  return (
    <div className="shot-pictures">
      {picture === undefined ? (
        <span className="file-thumb shot-thumb shot-empty">No picture yet</span>
      ) : (
        <StartPicture
          client={client}
          asset={picture}
          label={`${pictureName} of shot ${String(number)}`}
        />
      )}
      {props.clip === undefined ? undefined : (
        <Clip
          client={client}
          asset={props.clip}
          label={`the clip of shot ${String(number)}`}
        />
      )}
    </div>
  );
}
