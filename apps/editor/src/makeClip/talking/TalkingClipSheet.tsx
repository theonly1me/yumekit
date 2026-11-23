import { useRef, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../../engine/snapshot.js";
import { useEngineEvents } from "../../engine/useEngineEvents.js";
import { Sheet } from "../../sheets/Sheet.js";
import {
  currentModelOf,
  useMediaChoices,
} from "../../settings/services/index.js";
import { useMediaServers } from "../../tools/useMediaServers.js";
import type { Phase } from "../ClipAction.js";
import { outputsHoldingClip, sceneNumberOf } from "../clipOutputs.js";
import type { MadeClip } from "../makeClip.js";
import { MadeClipResult } from "../MadeClipResult.js";
import { makeTalkingClip } from "./makeTalkingClip.js";
import { TalkingClipForm } from "./TalkingClipForm.js";
import { sceneVoiceOf, speakersOf } from "./talkingFacts.js";
import { useTalkingChoice } from "./useTalkingChoice.js";
import "../makeClip.css";
import "./talking.css";

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
  const callId = useRef("");
  const media = useMediaServers(client);
  const mediaChoices = useMediaChoices(client);
  const [target, setTarget] = useState(props.clip);
  const [speakerKey, setSpeakerKey] = useState<string>();
  const [phase, setPhase] = useState<Phase>({ kind: "editing" });
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
  const sceneTitle = scene?.title ?? target.sceneId;
  const number = sceneNumberOf({ snapshot, output, clipId: target.id });
  const sceneName =
    number === undefined ? sceneTitle : `scene ${String(number)}`;

  useEngineEvents({
    client,
    onEvent: (event) => {
      if (event.type !== "call-progress" || event.callId !== callId.current) {
        return;
      }
      setPhase((current) =>
        current.kind === "making"
          ? { kind: "making", progress: event }
          : current,
      );
    },
  });

  const make = () => {
    const { choice, values } = talkingChoice;
    if (choice === undefined || speaker === undefined || voice === undefined) {
      return;
    }
    if (phase.kind === "making") return;
    callId.current = crypto.randomUUID();
    setPhase({ kind: "making", progress: undefined });
    makeTalkingClip({
      client,
      choice,
      values,
      speaker,
      voice,
      outputs: outputsHoldingClip({
        snapshot,
        clipId: target.id,
        currentOutput: output,
      }),
      clip: target,
      assets: snapshot.assets,
      callId: callId.current,
    })
      .then(async (outcome) => {
        setPhase(
          outcome.ok
            ? { kind: "made", made: outcome.made }
            : { kind: "failed", failure: outcome.failure },
        );
        await media.reload();
      })
      .catch((error: unknown) => {
        setPhase({
          kind: "failed",
          failure: { kind: "defect", message: String(error) },
        });
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
              setPhase({ kind: "editing" });
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
              if (phase.kind === "failed") setPhase({ kind: "editing" });
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
            onMake={make}
          />
        )}
      </div>
    </Sheet>
  );
}
