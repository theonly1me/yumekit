import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { useAssetUrl } from "../../makeClip/useAssetUrl.js";
import { PlayButton } from "../sound/PlayButton.js";
import type { FileRow } from "./fileFacts.js";

function PictureThumb(props: { client: EngineClient; row: FileRow }) {
  const url = useAssetUrl({
    client: props.client,
    assetId: props.row.asset.id,
  });
  return (
    <span className="file-thumb">
      {url === undefined ? undefined : <img src={url} alt={props.row.name} />}
    </span>
  );
}

function LoadedVideo(props: { client: EngineClient; row: FileRow }) {
  const url = useAssetUrl({
    client: props.client,
    assetId: props.row.asset.id,
  });
  return url === undefined ? (
    <span className="fact">Loading</span>
  ) : (
    <video
      src={url}
      aria-label={props.row.name}
      autoPlay
      controls
      playsInline
    />
  );
}

function VideoThumb(props: { client: EngineClient; row: FileRow }) {
  const [isLoaded, setLoaded] = useState(false);
  return (
    <span className="file-thumb" data-kind="video">
      {isLoaded ? (
        <LoadedVideo client={props.client} row={props.row} />
      ) : (
        <button
          type="button"
          className="play-sound"
          aria-label={`Play ${props.row.name}`}
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

export function FileThumb(props: { client: EngineClient; row: FileRow }) {
  const { client, row } = props;
  switch (row.asset.kind) {
    case "image":
      return <PictureThumb client={client} row={row} />;
    case "video":
      return <VideoThumb client={client} row={row} />;
    case "audio":
      return (
        <span className="file-thumb" data-kind="audio">
          <PlayButton
            client={client}
            label={row.name}
            piece={{
              assetId: row.asset.id,
              startSeconds: 0,
              lengthSeconds: row.lengthSeconds,
            }}
          />
        </span>
      );
    case "font":
      return (
        <span className="file-thumb" data-kind="font" aria-hidden="true">
          Aa
        </span>
      );
  }
}
