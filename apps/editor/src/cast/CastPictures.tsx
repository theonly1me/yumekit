import { useRef } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { useAssetUrl } from "../makeClip/useAssetUrl.js";
import { maximumPictures } from "./castEntries.js";

export function CastPicture(props: {
  client: EngineClient;
  assetId: string;
  label: string;
}) {
  const url = useAssetUrl({ client: props.client, assetId: props.assetId });
  return (
    <span className="cast-picture">
      {url === undefined ? undefined : <img src={url} alt={props.label} />}
    </span>
  );
}

export function CastPictureList(props: {
  client: EngineClient;
  name: string;
  pictureIds: string[];
  isUploading: boolean;
  onRemove: (assetId: string) => void;
  onUpload: (file: File) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const { pictureIds } = props;
  const hasRoom = pictureIds.length < maximumPictures;
  return (
    <div className="cast-picture-field">
      <p className="field-label">
        Pictures ({String(pictureIds.length)} of {String(maximumPictures)})
      </p>
      {pictureIds.length === 0 ? (
        <p className="fact">
          No pictures yet. A picture helps the AI keep the look the same.
        </p>
      ) : (
        <ul className="cast-picture-list">
          {[...pictureIds.entries()].map(([index, assetId]) => (
            <li key={assetId}>
              <CastPicture
                client={props.client}
                assetId={assetId}
                label={`Picture ${String(index + 1)} of ${props.name}`}
              />
              <button
                type="button"
                className="quiet"
                onClick={() => {
                  props.onRemove(assetId);
                }}
              >
                Remove picture {String(index + 1)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {hasRoom ? (
        <>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const [file] = event.target.files ?? [];
              event.target.value = "";
              if (file !== undefined) props.onUpload(file);
            }}
          />
          <button
            type="button"
            disabled={props.isUploading}
            onClick={() => fileInput.current?.click()}
          >
            {props.isUploading ? "Adding the picture" : "Add a picture"}
          </button>
        </>
      ) : undefined}
    </div>
  );
}
