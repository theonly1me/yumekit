import type { EngineClient } from "../engine/engineClient.js";
import { listText, placeNamesOf } from "./clipOutputs.js";
import type { MadeClip } from "./makeClip.js";
import { useAssetUrl } from "./useAssetUrl.js";

export function MadeClipResult(props: {
  client: EngineClient;
  made: MadeClip;
  sceneTitle: string;
  onBack: () => void;
  onAnother: () => void;
}) {
  const url = useAssetUrl({
    client: props.client,
    assetId: props.made.assetId,
  });
  return (
    <div className="made-clip">
      <div className="made-clip-picture">
        {url === undefined ? undefined : (
          <video
            src={url}
            aria-label={`The clip ${props.made.assetId}`}
            muted
            autoPlay
            loop
            playsInline
          />
        )}
      </div>
      <div className="made-clip-facts">
        <p className="clip-price">The clip is in the scene</p>
        <p className="fact">
          The new clip now plays in place of <strong>{props.sceneTitle}</strong>{" "}
          on {listText(placeNamesOf(props.made.outputs))}.
        </p>
        <div className="key-actions">
          <button type="button" className="primary" onClick={props.onBack}>
            Back to the editor
          </button>
          <button type="button" onClick={props.onAnother}>
            Make another clip
          </button>
        </div>
      </div>
    </div>
  );
}
