import { useEffect, useRef, useState, type SubmitEvent } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../engine/snapshot.js";
import { useEngineEvents } from "../engine/useEngineEvents.js";
import { useMediaServers } from "../tools/useMediaServers.js";
import type { Phase } from "./ClipAction.js";
import { ClipForm, type ClipDraft } from "./ClipForm.js";
import { MadeClipResult } from "./MadeClipResult.js";
import { makeClip, type MadeClip } from "./makeClip.js";
import { useClipChoice } from "./useClipChoice.js";
import "./makeClip.css";

export function MakeClipSheet(props: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  clip: SceneClip;
  onClose: () => void;
  onAddKey: (serverId: string) => void;
  onPlaced: (made: MadeClip) => void;
}) {
  const { client, snapshot, output } = props;
  const closeButton = useRef<HTMLButtonElement>(null);
  const callId = useRef("");
  const media = useMediaServers(client);
  const servers =
    media.state.kind === "ready" ? media.state.servers : undefined;
  const [target, setTarget] = useState(props.clip);
  const [draft, setDraft] = useState<ClipDraft>({
    prompt: "",
    firstFrameId: undefined,
    referenceIds: [],
  });
  const [phase, setPhase] = useState<Phase>({ kind: "editing" });
  const clipSeconds = Math.ceil(
    target.durationFrames / snapshot.project.framesPerSecond,
  );
  const clipChoice = useClipChoice({ servers, preferredSeconds: clipSeconds });
  const { choice, values } = clipChoice;
  const latestImageId = snapshot.assets
    .filter((asset) => asset.kind === "image")
    .at(-1)?.id;
  const firstFrameId = draft.firstFrameId ?? latestImageId;
  const sceneTitle =
    snapshot.scenes.find((scene) => scene.id === target.sceneId)?.title ??
    target.sceneId;

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

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

  const make = (event: SubmitEvent) => {
    event.preventDefault();
    if (choice === undefined || firstFrameId === undefined) return;
    if (phase.kind === "making") return;
    callId.current = crypto.randomUUID();
    setPhase({ kind: "making", progress: undefined });
    makeClip({
      client,
      choice,
      prompt: draft.prompt.trim(),
      values,
      firstFrameAssetId: firstFrameId,
      referenceAssetIds: draft.referenceIds,
      output,
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
    <div
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="make-clip-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") props.onClose();
      }}
    >
      <button
        ref={closeButton}
        type="button"
        className="tab sheet-close"
        onClick={props.onClose}
      >
        Close
      </button>
      <form className="sheet-body wide" onSubmit={make}>
        <h2 id="make-clip-title">Make a clip</h2>
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
            media={media.state}
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
            onAddKey={props.onAddKey}
          />
        )}
      </form>
    </div>
  );
}
