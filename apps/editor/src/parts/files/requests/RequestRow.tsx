import { useState } from "react";
import type { EngineClient } from "../../../engine/engineClient.js";
import type { Asset } from "../../../engine/snapshot.js";
import { useAssetUrl } from "../../../makeClip/useAssetUrl.js";
import {
  costOf,
  fileNameOf,
  kindWordOf,
  lengthOf,
  pictureRoleOf,
  settingsOf,
  timeOf,
} from "./requestFacts.js";
import type { MediaRequest } from "./requestSchema.js";

function SentPicture(props: {
  client: EngineClient;
  assetId: string | undefined;
  file: string;
  role: string;
}) {
  const url = useAssetUrl({ client: props.client, assetId: props.assetId });
  const name = fileNameOf(props.file);
  return (
    <figure className="request-picture">
      <span className="file-thumb">
        {url === undefined ? undefined : <img src={url} alt={name} />}
      </span>
      <figcaption>
        {pictureRoleOf(props.role)}
        <span>{name}</span>
      </figcaption>
    </figure>
  );
}

function PromptSent(props: { prompt: string }) {
  const [isWhole, setWhole] = useState(false);
  const isLong = props.prompt.length > 280;
  return (
    <div className="request-prompt">
      <p className="request-label">
        Prompt as sent, {props.prompt.length} characters
      </p>
      <p className="request-text" data-whole={String(isWhole || !isLong)}>
        {props.prompt}
      </p>
      {isLong ? (
        <button
          type="button"
          className="link-button"
          aria-expanded={isWhole}
          onClick={() => {
            setWhole(!isWhole);
          }}
        >
          {isWhole ? "Show less" : "Show the whole prompt"}
        </button>
      ) : undefined}
    </div>
  );
}

export function RequestRow(props: {
  client: EngineClient;
  request: MediaRequest;
  assets: Asset[];
  serviceLabelOf: (server: string) => string;
}) {
  const { request } = props;
  const assetIdOf = (file: string) => {
    const stem = fileNameOf(file).replace(/\.[^.]+$/, "");
    return props.assets.find((asset) => asset.id === stem)?.id;
  };
  const service =
    request.server === undefined
      ? "No service"
      : props.serviceLabelOf(request.server);
  const facts = [
    request.model === undefined ? service : `${service}, ${request.model}`,
    costOf(request),
    lengthOf(request),
    ...settingsOf(request),
  ].filter((fact) => fact !== undefined);
  return (
    <li
      className="request-row"
      data-failed={String(request.failure !== undefined)}
    >
      <div className="request-head">
        <span className="request-state">
          {request.failure === undefined ? "Made" : "Failed"}
        </span>
        <strong>{kindWordOf(request)}</strong>
        <span>{request.asset_id}</span>
        {request.shot_id === undefined ? undefined : (
          <span>Shot {request.shot_id}</span>
        )}
        <span className="request-time">{timeOf(request)}</span>
      </div>
      <p className="request-facts">{facts.join(". ")}.</p>
      {request.pictures.length === 0 ? undefined : (
        <div className="request-pictures" aria-label="Pictures sent">
          {request.pictures.map((...[picture, index]) => (
            <SentPicture
              key={`${picture.file}-${String(index)}`}
              client={props.client}
              assetId={assetIdOf(picture.file)}
              file={picture.file}
              role={picture.role}
            />
          ))}
        </div>
      )}
      {request.prompt_from_you === undefined ? undefined : (
        <PromptSent prompt={request.prompt_from_you} />
      )}
      {request.failure === undefined ? (
        <p className="request-result">
          Made {(request.files ?? []).map(fileNameOf).join(", ")}.
        </p>
      ) : (
        <div className="request-result" role="note">
          <code className="request-kind">{request.failure.kind}</code>
          <p>{request.failure.message}</p>
        </div>
      )}
    </li>
  );
}
