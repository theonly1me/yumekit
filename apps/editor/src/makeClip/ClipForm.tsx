import type { EngineClient } from "../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../engine/snapshot.js";
import { outputLabel } from "../timeline/timelineFacts.js";
import type { MediaServersState } from "../tools/useMediaServers.js";
import { ClipAction, type Phase } from "./ClipAction.js";
import { FirstFrame } from "./FirstFrame.js";
import { ModelList } from "./ModelList.js";
import { SettingsForm } from "./SettingsForm.js";
import type { useClipChoice } from "./useClipChoice.js";

export interface ClipDraft {
  prompt: string;
  firstFrameId: string | undefined;
  referenceIds: string[];
}

export function ClipForm(props: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  target: SceneClip;
  sceneTitle: string;
  media: MediaServersState;
  clipChoice: ReturnType<typeof useClipChoice>;
  draft: ClipDraft;
  onDraft: (change: Partial<ClipDraft>) => void;
  phase: Phase;
  onAddKey: (serverId: string) => void;
}) {
  const { client, snapshot, output, target, media, clipChoice, draft } = props;
  const { choice, values } = clipChoice;
  const imageIds = snapshot.assets
    .filter((asset) => asset.kind === "image")
    .map((image) => image.id);
  return (
    <div className="clip-columns">
      <div className="clip-column">
        <p className="fact">
          For the scene <strong>{props.sceneTitle}</strong> in{" "}
          <strong>{outputLabel(output)}</strong>, from frame {target.startFrame}{" "}
          for {target.durationFrames} frames.
        </p>
        <div className="field">
          <label htmlFor="clip-prompt">What happens in the clip</label>
          <textarea
            id="clip-prompt"
            rows={3}
            value={draft.prompt}
            placeholder="A street basketball player jumps for a dunk. Low angle, golden hour."
            onChange={(change) => {
              props.onDraft({ prompt: change.target.value });
            }}
          />
        </div>
        <FirstFrame
          client={client}
          assets={snapshot.assets}
          output={output}
          sceneId={target.sceneId}
          imageChoices={clipChoice.imageChoices}
          assetId={draft.firstFrameId}
          onPick={(firstFrameId) => {
            props.onDraft({ firstFrameId });
          }}
        />
        <ModelList
          choices={clipChoice.videoChoices}
          chosenKey={choice?.key}
          onChoose={clipChoice.choose}
        />
      </div>
      <div className="clip-column">
        {media.kind === "failed" ? (
          <p className="failure" role="alert">
            {media.message}
          </p>
        ) : undefined}
        {media.kind === "loading" ? (
          <p className="fact">Reading the models.</p>
        ) : undefined}
        {choice === undefined || media.kind !== "ready" ? undefined : (
          <>
            <SettingsForm
              settings={choice.model.settings}
              values={values}
              onChange={clipChoice.change}
              imageIds={imageIds}
              referenceIds={draft.referenceIds}
              onReferences={(referenceIds) => {
                props.onDraft({ referenceIds });
              }}
            />
            <ClipAction
              choice={choice}
              values={values}
              limit={{
                usedSeconds: media.servers.generated_video.used_seconds,
                limitSeconds: media.servers.generated_video.limit_seconds,
              }}
              phase={props.phase}
              canMake={
                draft.prompt.trim() !== "" && draft.firstFrameId !== undefined
              }
              onAddKey={props.onAddKey}
            />
          </>
        )}
      </div>
    </div>
  );
}
