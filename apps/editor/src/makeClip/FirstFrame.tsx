import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Asset, Output } from "../engine/snapshot.js";
import { MakeStill } from "./MakeStill.js";
import type { ModelChoice } from "./modelChoices.js";
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

export function FirstFrame(props: {
  client: EngineClient;
  assets: Asset[];
  output: Output;
  sceneId: string;
  imageChoices: ModelChoice[];
  assetId: string | undefined;
  onPick: (assetId: string) => void;
}) {
  const { client } = props;
  const images = props.assets.filter((asset) => asset.kind === "image");
  const [isMaking, setMaking] = useState(false);
  const showsStillForm = isMaking || images.length === 0;

  return (
    <div className="first-frame-field">
      <div className="first-frame">
        <Picture client={client} assetId={props.assetId} />
        <p className="fact">
          <strong>First frame</strong>
          {props.assetId === undefined
            ? "The clip starts from a still image. Make one from a prompt."
            : `The clip starts from the image ${props.assetId}.`}
        </p>
      </div>
      {images.length > 1 ? (
        <div className="frame-picks" role="group" aria-label="Image assets">
          {images
            .slice(-shownImageCount)
            .reverse()
            .map((image) => (
              <button
                key={image.id}
                type="button"
                className="frame-pick"
                aria-pressed={image.id === props.assetId}
                aria-label={`Use ${image.id} as the first frame`}
                onClick={() => {
                  props.onPick(image.id);
                }}
              >
                <Picture client={client} assetId={image.id} />
              </button>
            ))}
        </div>
      ) : undefined}
      {showsStillForm ? (
        <MakeStill
          client={client}
          choices={props.imageChoices}
          output={props.output}
          assets={props.assets}
          sceneId={props.sceneId}
          onMade={(assetId) => {
            setMaking(false);
            props.onPick(assetId);
          }}
        />
      ) : (
        <button
          type="button"
          className="tab"
          onClick={() => {
            setMaking(true);
          }}
        >
          Make a still from a prompt
        </button>
      )}
    </div>
  );
}
