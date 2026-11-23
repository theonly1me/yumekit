import type { EngineClient } from "../../engine/engineClient.js";
import type { KeyRequests } from "../../tools/requestText.js";
import type { MediaServersState } from "../../tools/useMediaServers.js";
import { ClipAction, type Phase } from "../ClipAction.js";
import { ModelList } from "../ModelList.js";
import { SettingsForm } from "../SettingsForm.js";
import type { SceneVoice, Speaker } from "./talkingFacts.js";
import type { useTalkingChoice } from "./useTalkingChoice.js";
import { VoiceGroup } from "./VoiceGroup.js";
import { WhoTalks } from "./WhoTalks.js";

function noModelText(kind: "image" | "video"): string {
  return kind === "image"
    ? "No connected tool makes a person in a picture talk."
    : "No connected tool makes a person in a video talk.";
}

export function TalkingClipForm(props: {
  client: EngineClient;
  sceneName: string;
  sceneTitle: string;
  speakers: Speaker[];
  speaker: Speaker;
  onSpeaker: (key: string) => void;
  voice: SceneVoice | undefined;
  onRecordVoice: () => void;
  media: MediaServersState;
  keyRequests: KeyRequests;
  talkingChoice: ReturnType<typeof useTalkingChoice>;
  phase: Phase;
  onMake: () => void;
}) {
  const { client, media, talkingChoice, speaker } = props;
  const { choice, values } = talkingChoice;
  return (
    <>
      <p className="fact lead">
        For {props.sceneName}: {props.sceneTitle}. A talking model makes the
        person speak the voice of this scene, with moving lips.
      </p>
      <div className="clip-columns">
        <div className="clip-column">
          <WhoTalks
            client={client}
            speakers={props.speakers}
            chosenKey={speaker.key}
            onChoose={props.onSpeaker}
          />
          <VoiceGroup
            client={client}
            voice={props.voice}
            onRecordVoice={props.onRecordVoice}
          />
          {media.kind === "ready" &&
          talkingChoice.talkingChoices.length === 0 ? (
            <p className="fact">{noModelText(speaker.kind)}</p>
          ) : (
            <ModelList
              choices={talkingChoice.talkingChoices}
              chosenKey={choice?.key}
              onChoose={talkingChoice.choose}
              priceFor={talkingChoice.priceFor}
            />
          )}
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
          {choice === undefined ||
          media.kind !== "ready" ||
          props.voice === undefined ? undefined : (
            <>
              <SettingsForm
                settings={choice.model.settings}
                values={values}
                onChange={talkingChoice.change}
                imageIds={[]}
                referenceIds={[]}
                onReferences={() => undefined}
              />
              <ClipAction
                choice={choice}
                values={values}
                limit={{
                  usedSeconds: media.servers.generated_video.used_seconds,
                  limitSeconds: media.servers.generated_video.limit_seconds,
                }}
                phase={props.phase}
                missing={undefined}
                sceneName={props.sceneName}
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
