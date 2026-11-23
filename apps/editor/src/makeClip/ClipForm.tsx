import type { EngineClient } from "../engine/engineClient.js";
import type { Output, SceneClip, Snapshot } from "../engine/snapshot.js";
import type { KeyRequests } from "../tools/requestText.js";
import type { MediaServersState } from "../tools/useMediaServers.js";
import type { CameraMoveId } from "@yumekit/project/camera-moves";
import { CameraMovePicker } from "./CameraMovePicker.js";
import { ClipAction, type Phase } from "./ClipAction.js";
import { assetNameOf } from "../names/index.js";
import { FirstFrame } from "./FirstFrame.js";
import type { ScenePicture } from "./scenePicture.js";
import type { FirstPicture } from "./useClipMaking.js";
import { LastFrame } from "./LastFrame.js";
import { ModelList } from "./ModelList.js";
import { takesFirstPicture, takesLastPicture } from "./modelChoices.js";
import { PromptField } from "./PromptField.js";
import { SettingsForm } from "./SettingsForm.js";
import type { useClipChoice } from "./useClipChoice.js";

export interface ClipDraft {
  prompt: string;
  firstPicture: FirstPicture;
  lastFrameId: string | undefined;
  cameraMoveId: CameraMoveId | undefined;
  referenceIds: string[];
}

function missingText(options: {
  leadMissing: string | undefined;
  hasPrompt: boolean;
  picture: ScenePicture["kind"] | "picked" | "not-needed";
}): string | undefined {
  if (options.leadMissing !== undefined) return options.leadMissing;
  if (!options.hasPrompt) {
    return "Write what happens in the clip, in the box under Camera.";
  }
  if (options.picture === "loading") {
    return "One moment: yumekit makes the picture of the scene.";
  }
  if (options.picture === "failed") {
    return "Pick a picture to start on, under the box of the prompt.";
  }
  return undefined;
}

export function ClipForm(props: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  target: SceneClip;
  sceneTitle: string;
  sceneNumber: number | undefined;
  media: MediaServersState;
  keyRequests: KeyRequests;
  clipChoice: ReturnType<typeof useClipChoice>;
  draft: ClipDraft;
  onDraft: (change: Partial<ClipDraft>) => void;
  scenePicture: ScenePicture;
  phase: Phase;
  leadMissing: string | undefined;
  onMake: () => void;
  onAskTheAi: () => void;
}) {
  const { client, snapshot, output, target, media, clipChoice, draft } = props;
  const { choice, values } = clipChoice;
  const takesPicture =
    choice === undefined ? true : takesFirstPicture(choice.model);
  const takesEnd =
    takesPicture && choice !== undefined && takesLastPicture(choice.model);
  const images = snapshot.assets
    .filter((asset) => asset.kind === "image")
    .map((image) => ({ id: image.id, name: assetNameOf(image) }));
  const pictureState = !takesPicture
    ? "not-needed"
    : draft.firstPicture.kind === "asset"
      ? "picked"
      : props.scenePicture.kind;
  const sceneName =
    props.sceneNumber === undefined
      ? props.sceneTitle
      : `scene ${String(props.sceneNumber)}`;
  return (
    <>
      <p className="fact lead">
        For {sceneName}: {props.sceneTitle}. A video model makes moving video
        from your words.
      </p>
      <div className="clip-columns">
        <div className="clip-column">
          <CameraMovePicker
            chosen={draft.cameraMoveId}
            onChoose={(cameraMoveId) => {
              props.onDraft({ cameraMoveId });
            }}
          />
          <PromptField
            prompt={draft.prompt}
            onPrompt={(prompt) => {
              props.onDraft({ prompt });
            }}
            onAskTheAi={props.onAskTheAi}
          />
          {takesPicture ? (
            <FirstFrame
              client={client}
              assets={snapshot.assets}
              output={output}
              sceneId={target.sceneId}
              imageChoices={clipChoice.imageChoices}
              firstPicture={draft.firstPicture}
              scenePicture={props.scenePicture}
              onPick={(firstPicture) => {
                props.onDraft({ firstPicture });
              }}
            />
          ) : undefined}
          {takesEnd ? (
            <LastFrame
              client={client}
              assets={snapshot.assets}
              assetId={draft.lastFrameId}
              onPick={(lastFrameId) => {
                props.onDraft({ lastFrameId });
              }}
            />
          ) : undefined}
          <ModelList
            choices={clipChoice.videoChoices}
            chosenKey={choice?.key}
            onChoose={clipChoice.choose}
            priceFor={clipChoice.priceFor}
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
                images={images}
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
                missing={missingText({
                  leadMissing: props.leadMissing,
                  hasPrompt: draft.prompt.trim() !== "",
                  picture: pictureState,
                })}
                sceneName={sceneName}
                keyRequests={props.keyRequests}
                onMake={props.onMake}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
