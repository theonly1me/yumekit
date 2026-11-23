import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../engine/snapshot.js";
import { sceneNameById } from "../names/index.js";
import { Sheet } from "../sheets/Sheet.js";
import {
  currentModelOf,
  useMediaChoices,
  type ModelTarget,
} from "../settings/services/index.js";
import { useMediaServers } from "../tools/useMediaServers.js";
import { ClipForm, type ClipDraft } from "./ClipForm.js";
import { MadeClipResult } from "./MadeClipResult.js";
import { sceneNumberOf } from "./clipOutputs.js";
import type { MadeClip } from "./makeClip.js";
import { modelTargetOf } from "./modelChoices.js";
import { useScenePicture } from "./scenePicture.js";
import { earlierCameraMoveOf, promptOfScene } from "./scenePrompt.js";
import { useClipChoice } from "./useClipChoice.js";
import { useClipMaking } from "./useClipMaking.js";
import "./makeClip.css";
import "./clipSheetLayout.css";

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
    firstPicture: { kind: "scene" },
    lastFrameId: undefined,
    cameraMoveId:
      scene === undefined
        ? undefined
        : earlierCameraMoveOf({ scene, assets: snapshot.assets }),
    referenceIds: [],
  }));
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
  const sceneTitle = sceneNameById({
    sceneId: target.sceneId,
    scenes: snapshot.scenes,
    assets: snapshot.assets,
  });
  const scenePicture = useScenePicture({
    client,
    outputId: output.id,
    sceneId: target.sceneId,
    sceneKey: JSON.stringify([
      scene,
      snapshot.sceneCode[target.sceneId] ?? "",
      snapshot.project.look ?? "",
      snapshot.project.calm ?? false,
    ]),
  });
  const making = useClipMaking({
    client,
    snapshot,
    output,
    target,
    sceneName: sceneTitle,
    scenePicture,
    onMade: media.reload,
  });
  const { phase, setPhase } = making;
  const clearFailure = () => {
    if (phase.kind === "failed") setPhase({ kind: "editing" });
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
              setDraft({ ...draft, firstPicture: { kind: "scene" } });
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
            draft={draft}
            scenePicture={scenePicture}
            onDraft={(change) => {
              clearFailure();
              setDraft({ ...draft, ...change });
            }}
            phase={phase}
            onMake={() => {
              if (choice === undefined) return;
              making.make({ choice, values, draft });
            }}
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
