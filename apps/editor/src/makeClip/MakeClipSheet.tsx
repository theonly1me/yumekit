import { useRef, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../engine/snapshot.js";
import { useEngineEvents } from "../engine/useEngineEvents.js";
import { Sheet } from "../sheets/Sheet.js";
import {
  currentModelOf,
  useMediaChoices,
  type ModelTarget,
} from "../settings/services/index.js";
import { useMediaServers } from "../tools/useMediaServers.js";
import type { Phase } from "./ClipAction.js";
import { ClipForm, type ClipDraft } from "./ClipForm.js";
import { MadeClipResult } from "./MadeClipResult.js";
import { outputsHoldingClip, sceneNumberOf } from "./clipOutputs.js";
import { makeClip, type MadeClip } from "./makeClip.js";
import {
  modelTargetOf,
  takesFirstPicture,
  takesLastPicture,
} from "./modelChoices.js";
import { earlierCameraMoveOf, promptOfScene } from "./scenePrompt.js";
import { useClipChoice } from "./useClipChoice.js";
import "./makeClip.css";

export function MakeClipSheet(props: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  clip: SceneClip;
  onClose: () => void;
  onPlaced: (made: MadeClip) => void;
  onAskTheAi: (model: ModelTarget | undefined) => void;
}) {
  const { client, snapshot, output } = props;
  const callId = useRef("");
  const media = useMediaServers(client);
  const servers =
    media.state.kind === "ready" ? media.state.servers : undefined;
  const [target, setTarget] = useState(props.clip);
  const scene = snapshot.scenes.find((each) => each.id === target.sceneId);
  const [draft, setDraft] = useState<ClipDraft>(() => ({
    prompt:
      scene === undefined
        ? ""
        : promptOfScene({ scene, assets: snapshot.assets }),
    firstFrameId: undefined,
    lastFrameId: undefined,
    cameraMoveId:
      scene === undefined
        ? undefined
        : earlierCameraMoveOf({ scene, assets: snapshot.assets }),
    referenceIds: [],
  }));
  const [phase, setPhase] = useState<Phase>({ kind: "editing" });
  const clipSeconds = Math.ceil(
    target.durationFrames / snapshot.project.framesPerSecond,
  );
  const mediaChoices = useMediaChoices(client);
  const clipChoice = useClipChoice({
    servers,
    preferredSeconds: clipSeconds,
    pickedModel: currentModelOf({ state: mediaChoices.state, kind: "video" }),
  });
  const { choice, values } = clipChoice;
  const latestImageId = snapshot.assets
    .filter((asset) => asset.kind === "image")
    .at(-1)?.id;
  const firstFrameId = draft.firstFrameId ?? latestImageId;
  const sceneTitle = scene?.title ?? target.sceneId;

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

  const clearFailure = () => {
    if (phase.kind === "failed") setPhase({ kind: "editing" });
  };

  const make = () => {
    if (choice === undefined) return;
    const takesPicture = takesFirstPicture(choice.model);
    if (takesPicture && firstFrameId === undefined) return;
    if (phase.kind === "making") return;
    callId.current = crypto.randomUUID();
    setPhase({ kind: "making", progress: undefined });
    makeClip({
      client,
      choice,
      prompt: draft.prompt.trim(),
      values,
      firstFrameAssetId: takesPicture ? firstFrameId : undefined,
      lastFrameAssetId:
        takesPicture && takesLastPicture(choice.model)
          ? draft.lastFrameId
          : undefined,
      cameraMoveId: draft.cameraMoveId,
      referenceAssetIds: draft.referenceIds,
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
        ) : (
          <ClipForm
            client={client}
            snapshot={snapshot}
            output={output}
            target={target}
            sceneTitle={sceneTitle}
            sceneNumber={sceneNumberOf({
              snapshot,
              output,
              clipId: target.id,
            })}
            media={media.state}
            keyRequests={media.requests}
            clipChoice={{
              ...clipChoice,
              choose: (key) => {
                clearFailure();
                clipChoice.choose(key);
              },
              change: (change) => {
                clearFailure();
                clipChoice.change(change);
              },
            }}
            draft={{ ...draft, firstFrameId }}
            onDraft={(change) => {
              clearFailure();
              setDraft({ ...draft, ...change });
            }}
            phase={phase}
            onMake={make}
            onAskTheAi={() => {
              props.onAskTheAi(
                choice === undefined ? undefined : modelTargetOf(choice),
              );
            }}
          />
        )}
      </div>
    </Sheet>
  );
}
