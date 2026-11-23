import { changeStartOf, fitTheVoiceRequest } from "../chat/requestTexts.js";
import type { EngineClient } from "../engine/engineClient.js";
import { fixedRequestTextOf } from "../parts/fixedRequests.js";
import type {
  Output,
  SceneClip,
  Snapshot,
  Timeline as TimelineData,
} from "../engine/snapshot.js";
import { SceneActions, type PickedCard } from "../scenes/SceneActions.js";
import { isVideoScene, SceneCards } from "../scenes/SceneCards.js";
import type { SceneEdits } from "../scenes/sceneEdits.js";
import type { DirectChanges } from "../scenes/useDirectChanges.js";
import { useSceneStills } from "../scenes/useSceneStills.js";
import { SoundRows } from "../sound/SoundRows.js";
import { soundRowsOf, type SoundPartName } from "../sound/soundRowFacts.js";
import { useSoundNotes } from "../sound/useSoundNotes.js";
import { Timeline, type PickedClip } from "../timeline/Timeline.js";
import type { EditorChat } from "./useEditorChat.js";

export function LowerArea(props: {
  client: EngineClient;
  snapshot: Snapshot;
  output: Output;
  timeline: TimelineData;
  mainClips: SceneClip[];
  lengthFrames: number;
  frame: number;
  picked: PickedCard | undefined;
  shownClipId: string | undefined;
  selectedClipId: string | undefined;
  changes: DirectChanges;
  edits: SceneEdits;
  editorChat: EditorChat;
  isTimelineOpen: boolean;
  onTimelineOpen: (isOpen: boolean) => void;
  onPickCard: (clip: SceneClip) => void;
  onPick: (clip: PickedClip) => void;
  onSeek: (frame: number) => void;
  onEditText: () => void;
  onMakeClip: (clip: SceneClip) => void;
  onOpenSound: (part: SoundPartName) => void;
}) {
  const { client, snapshot, output, mainClips, picked, changes, edits } = props;
  const { editorChat } = props;
  const framesPerSecond = snapshot.project.framesPerSecond;
  const stills = useSceneStills({
    client,
    snapshot,
    output,
    clips: mainClips,
  });
  const sceneFailure = changes.failureOf("scenes");
  const soundRows = soundRowsOf({
    timeline: props.timeline,
    scenes: snapshot.scenes,
    assets: snapshot.assets,
  });
  const soundNotes = useSoundNotes({
    client,
    snapshot,
    rows: soundRows,
    editorChat,
    onOpenSound: props.onOpenSound,
  });
  return (
    <>
      <section className="scenes-row" aria-label="Scenes and actions">
        {mainClips.length === 0 ? (
          <p className="fact">
            This video has no scenes yet. Ask the AI in the chat to make it.
          </p>
        ) : (
          <SceneCards
            output={output}
            clips={mainClips}
            scenes={snapshot.scenes}
            assets={snapshot.assets}
            stills={stills}
            pickedClipId={picked?.clip.id}
            shownClipId={props.shownClipId}
            framesPerSecond={framesPerSecond}
            onPick={props.onPickCard}
            onMove={edits.move}
            onAddScene={editorChat.sendText}
            onTransition={edits.transition}
          />
        )}
        {changes.voiceMayNotMatch ? (
          <div className="voice-note" role="status">
            <p>The voice may not match the scenes now.</p>
            <button
              type="button"
              disabled={editorChat.chat.isRunning}
              onClick={() => {
                editorChat.sendText(fitTheVoiceRequest);
              }}
            >
              Ask the AI to fit the voice
            </button>
          </div>
        ) : undefined}
        {mainClips.length === 0 ? undefined : (
          <SceneActions
            picked={picked}
            isVideo={isVideoScene(
              snapshot.scenes.find(
                (scene) => scene.id === picked?.clip.sceneId,
              ),
            )}
            isChatRunning={editorChat.chat.isRunning}
            framesPerSecond={framesPerSecond}
            onEditText={props.onEditText}
            onLength={(durationFrames) => {
              if (picked !== undefined) {
                edits.resize({ clip: picked.clip, durationFrames });
              }
            }}
            onMakeClip={() => {
              if (picked !== undefined) props.onMakeClip(picked.clip);
            }}
            onBackToGraphics={() => {
              if (picked === undefined) return;
              editorChat.sendAboutClip({
                text: fixedRequestTextOf({
                  kind: "back-to-graphics",
                  aboutClipId: picked.clip.id,
                }),
                clipId: picked.clip.id,
              });
            }}
            onDuplicate={() => {
              if (picked !== undefined) edits.duplicate(picked.clip);
            }}
            onDelete={() => {
              if (picked !== undefined) edits.remove(picked.clip);
            }}
          />
        )}
        {sceneFailure === undefined ? undefined : (
          <p className="change-failure" role="alert">
            {sceneFailure}
          </p>
        )}
      </section>
      <section className="lower-rows" aria-label="Sound and timeline">
        <SoundRows
          rows={soundRows}
          notes={soundNotes.notes}
          isChatRunning={editorChat.chat.isRunning}
          onNoteAction={soundNotes.onNoteAction}
          failure={changes.failureOf("sound")}
          onChange={(rowName) => {
            editorChat.fillBox(changeStartOf(rowName));
          }}
          onOpen={props.onOpenSound}
          onSwitch={({ trackId, off }) => {
            changes
              .run({
                area: "sound",
                name: "set_track_off",
                input: { track_id: trackId, off },
              })
              .catch(() => undefined);
          }}
        />
        <label className="switch timeline-switch">
          <input
            type="checkbox"
            role="switch"
            checked={props.isTimelineOpen}
            onChange={(event) => {
              props.onTimelineOpen(event.currentTarget.checked);
            }}
          />{" "}
          Detailed timeline
        </label>
        {props.isTimelineOpen ? (
          <Timeline
            timeline={props.timeline}
            scenes={snapshot.scenes}
            assets={snapshot.assets}
            lengthFrames={props.lengthFrames}
            frame={props.frame}
            framesPerSecond={framesPerSecond}
            tempo={snapshot.project.tempo}
            selectedClipId={props.selectedClipId}
            onPick={props.onPick}
            onSeek={props.onSeek}
          />
        ) : undefined}
      </section>
    </>
  );
}
