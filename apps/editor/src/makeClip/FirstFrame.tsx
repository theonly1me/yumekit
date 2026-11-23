import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Asset, Output } from "../engine/snapshot.js";
import { assetNameOf } from "../names/index.js";
import { MakeStill } from "./MakeStill.js";
import type { ModelChoice } from "./modelChoices.js";
import type { ScenePicture } from "./scenePicture.js";
import { useAssetUrl } from "./useAssetUrl.js";
import type { FirstPicture } from "./useClipMaking.js";

const shownImageCount = 5;

function Picture(props: {
  url: string | undefined;
  note?: string | undefined;
  ratio?: string | undefined;
}) {
  return (
    <span
      className="first-frame-picture"
      style={props.ratio === undefined ? {} : { aspectRatio: props.ratio }}
    >
      {props.url === undefined ? (
        <span className="first-frame-note">{props.note}</span>
      ) : (
        <img src={props.url} alt="" />
      )}
    </span>
  );
}

function AssetPicture(props: {
  client: EngineClient;
  assetId: string;
  ratio?: string | undefined;
}) {
  return <Picture url={useAssetUrl(props)} ratio={props.ratio} />;
}

function sceneNoteOf(picture: ScenePicture): string {
  return picture.kind === "failed" ? "No picture" : "Making the picture";
}

function chosenTextOf(options: {
  firstPicture: FirstPicture;
  scenePicture: ScenePicture;
  assets: Asset[];
}): string {
  const { firstPicture } = options;
  if (firstPicture.kind === "scene") {
    return options.scenePicture.kind === "failed"
      ? `The picture of this scene did not load: ${options.scenePicture.message} Pick another picture.`
      : "The clip starts from this scene, as the video shows it now.";
  }
  const asset = options.assets.find((each) => each.id === firstPicture.assetId);
  return asset === undefined
    ? "The clip starts from this picture."
    : `The clip starts from the picture "${assetNameOf(asset)}".`;
}

export function FirstFrame(props: {
  client: EngineClient;
  assets: Asset[];
  output: Output;
  sceneId: string;
  imageChoices: ModelChoice[];
  firstPicture: FirstPicture;
  scenePicture: ScenePicture;
  onPick: (firstPicture: FirstPicture) => void;
}) {
  const { client, firstPicture, scenePicture } = props;
  const images = props.assets.filter((asset) => asset.kind === "image");
  const [isMaking, setMaking] = useState(false);
  const sceneUrl = scenePicture.kind === "ready" ? scenePicture.url : undefined;
  const ratio = `${String(props.output.widthPixels)} / ${String(props.output.heightPixels)}`;
  return (
    <div className="first-frame-field">
      <div className="first-frame">
        {firstPicture.kind === "scene" ? (
          <Picture
            url={sceneUrl}
            note={sceneNoteOf(scenePicture)}
            ratio={ratio}
          />
        ) : (
          <AssetPicture
            client={client}
            assetId={firstPicture.assetId}
            ratio={ratio}
          />
        )}
        <p className="fact">
          <strong>Start on this picture</strong>
          {chosenTextOf({ firstPicture, scenePicture, assets: props.assets })}
        </p>
      </div>
      <div
        className="frame-picks"
        role="group"
        aria-label="Pictures to start on"
      >
        <button
          type="button"
          className="frame-pick"
          aria-pressed={firstPicture.kind === "scene"}
          aria-label="Start on the picture of this scene"
          onClick={() => {
            props.onPick({ kind: "scene" });
          }}
        >
          <Picture url={sceneUrl} note="" />
        </button>
        {images
          .slice(-shownImageCount)
          .reverse()
          .map((image) => (
            <button
              key={image.id}
              type="button"
              className="frame-pick"
              aria-pressed={
                firstPicture.kind === "asset" &&
                firstPicture.assetId === image.id
              }
              aria-label={`Start on ${assetNameOf(image)}`}
              onClick={() => {
                props.onPick({ kind: "asset", assetId: image.id });
              }}
            >
              <AssetPicture client={client} assetId={image.id} />
            </button>
          ))}
        {isMaking ? undefined : (
          <button
            type="button"
            className="tab"
            onClick={() => {
              setMaking(true);
            }}
          >
            Make a new picture
          </button>
        )}
      </div>
      {isMaking ? (
        <MakeStill
          client={client}
          choices={props.imageChoices}
          output={props.output}
          assets={props.assets}
          sceneId={props.sceneId}
          onMade={(assetId) => {
            setMaking(false);
            props.onPick({ kind: "asset", assetId });
          }}
        />
      ) : undefined}
    </div>
  );
}
