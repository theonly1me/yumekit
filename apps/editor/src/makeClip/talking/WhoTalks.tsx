import type { EngineClient } from "../../engine/engineClient.js";
import { useAssetUrl } from "../useAssetUrl.js";
import type { Speaker } from "./talkingFacts.js";

function SpeakerPicture(props: { client: EngineClient; speaker: Speaker }) {
  const url = useAssetUrl({
    client: props.client,
    assetId: props.speaker.assetId,
  });
  return (
    <span className="first-frame-picture speaker-picture">
      {url === undefined ? undefined : props.speaker.kind === "video" ? (
        <video src={url} muted playsInline preload="metadata" />
      ) : (
        <img src={url} alt="" />
      )}
    </span>
  );
}

export function WhoTalks(props: {
  client: EngineClient;
  speakers: Speaker[];
  chosenKey: string | undefined;
  onChoose: (key: string) => void;
}) {
  return (
    <fieldset className="speakers">
      <legend>Who talks</legend>
      <div className="speaker-picks">
        {props.speakers.map((speaker) => (
          <button
            key={speaker.key}
            type="button"
            className="speaker-pick"
            aria-pressed={speaker.key === props.chosenKey}
            onClick={() => {
              props.onChoose(speaker.key);
            }}
          >
            <SpeakerPicture client={props.client} speaker={speaker} />
            <span className="speaker-name">{speaker.name}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
