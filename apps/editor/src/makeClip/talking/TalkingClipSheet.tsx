import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../../engine/snapshot.js";
import { useLeadMaking } from "../../lead/useLeadMaking.js";
import { Sheet } from "../../sheets/Sheet.js";
import {
  currentModelOf,
  useMediaChoices,
} from "../../settings/services/index.js";
import { useMediaServers } from "../../tools/useMediaServers.js";
import { outputsHoldingClip, sceneNumberOf } from "../clipOutputs.js";
import { madeClipOf, type MadeClip } from "../makeClip.js";
import { MadeClipResult } from "../MadeClipResult.js";
import { talkingRequestOf } from "./makeTalkingClip.js";
import { TalkingClipForm } from "./TalkingClipForm.js";
import { sceneVoiceOf, speakersOf } from "./talkingFacts.js";
import { useTalkingChoice } from "./useTalkingChoice.js";
import "../makeClip.css";
import "./talking.css";
import { sceneNameById } from "../../names/index.js";

export function TalkingClipSheet(props: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  clip: SceneClip;
  onClose: () => void;
  onPlaced: (made: MadeClip) => void;
  onRecordVoice: (clipId: string) => void;
}) {
  const { client, snapshot, output } = props;
  const media = useMediaServers(client);
  const mediaChoices = useMediaChoices(client);
  const [target, setTarget] = useState(props.clip);
  const [speakerKey, setSpeakerKey] = useState<string>();
  const making = useLeadMaking<MadeClip>({ client, onFinished: media.reload });
  const { phase } = making;
  const scene = snapshot.scenes.find((each) => each.id === target.sceneId);
  const speakers = scene === undefined ? [] : speakersOf({ snapshot, scene });
  const [firstSpeaker] = speakers;
  const speaker =
    speakers.find((each) => each.key === speakerKey) ?? firstSpeaker;
  const voice = sceneVoiceOf({ snapshot, output, clip: target });
  const talkingChoice = useTalkingChoice({
    servers: media.state.kind === "ready" ? media.state.servers : undefined,
    kind: speaker?.kind ?? "image",
    seconds: voice === undefined ? 0 : voice.leadSeconds + voice.lengthSeconds,
    pickedModel: currentModelOf({
      state: mediaChoices.state,
      kind: "talking-clip",
    }),
  });
  const sceneTitle = sceneNameById({
    sceneId: target.sceneId,
    scenes: snapshot.scenes,
    assets: snapshot.assets,
  });
  const number = sceneNumberOf({ snapshot, output, clipId: target.id });
  const sceneName =
    number === undefined ? sceneTitle : `scene ${String(number)}`;

  const make = () => {
    const { choice, values } = talkingChoice;
    if (choice === undefined || speaker === undefined || voice === undefined) {
      return;
    }
    if (phase.kind === "making") return;
    const outputs = outputsHoldingClip({
      snapshot,
      clipId: target.id,
      currentOutput: output,
    });
    const { assetId, request } = talkingRequestOf({
      choice,
      values,
      speaker,
      voice,
      outputs,
      clip: target,
      assets: snapshot.assets,
    });
    making.make({
      exact: request,
      find: (latest) =>
        madeClipOf({ snapshot: latest, assetId, clip: target, outputs }),
    });
  };

  return (
    <Sheet titleId="make-clip-title" onClose={props.onClose}>
      <div className="sheet-body wide">
        <h2 id="make-clip-title">Make a real video clip</h2>
        {phase.kind === "made" ? (
          <MadeClipResult
            client={client}
            made={phase.made}
            sceneTitle={sceneTitle}
            onBack={() => {
              props.onPlaced(phase.made);
            }}
            onAnother={() => {
              setTarget({
                ...target,
                id: phase.made.sceneClipId,
                sceneId: `video-${phase.made.assetId}`,
              });
              making.reset();
            }}
          />
        ) : speaker === undefined ? (
          <p className="fact lead">
            Add a person with a picture in Cast, or give this scene a picture.
            Then a talking model can make the person speak.
          </p>
        ) : (
          <TalkingClipForm
            client={client}
            sceneName={sceneName}
            sceneTitle={sceneTitle}
            speakers={speakers}
            speaker={speaker}
            onSpeaker={(key) => {
              if (phase.kind === "failed") making.reset();
              setSpeakerKey(key);
            }}
            voice={voice}
            onRecordVoice={() => {
              props.onRecordVoice(target.id);
            }}
            media={media.state}
            keyRequests={media.requests}
            talkingChoice={talkingChoice}
            phase={phase}
            leadMissing={
              making.readiness.kind === "missing"
                ? making.readiness.message
                : undefined
            }
            onMake={make}
          />
        )}
      </div>
    </Sheet>
  );
}
