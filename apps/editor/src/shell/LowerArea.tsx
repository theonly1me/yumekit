import type { EngineClient } from "../engine/engineClient.js";
import type {
  Output,
  SceneClip,
  Snapshot,
  Timeline as TimelineData,
} from "../engine/snapshot.js";
import { SceneActions, type PickedCard } from "../scenes/SceneActions.js";
import { SceneCards } from "../scenes/SceneCards.js";
import type { SceneEdits } from "../scenes/sceneEdits.js";
import type { DirectChanges } from "../scenes/useDirectChanges.js";
import { useSceneStills } from "../scenes/useSceneStills.js";
import { SoundRows } from "../sound/SoundRows.js";
import { soundRowsOf } from "../sound/soundRowFacts.js";
import { Timeline, type PickedClip } from "../timeline/Timeline.js";

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
  isTimelineOpen: boolean;
  onTimelineOpen: (isOpen: boolean) => void;
  onPickCard: (clip: SceneClip) => void;
  onPick: (clip: PickedClip) => void;
  onSeek: (frame: number) => void;
  onEditText: () => void;
  onMakeClip: (clip: SceneClip) => void;
}) {
  const { client, snapshot, output, mainClips, picked, changes, edits } = props;
  const framesPerSecond = snapshot.project.framesPerSecond;
  const stills = useSceneStills({
    client,
    output,
    clips: mainClips,
    revision: snapshot.revision,
  });
  const sceneFailure = changes.failureOf("scenes");
  return (
    <>
      <section className="scenes-row" aria-label="Scenes and actions">
        {mainClips.length === 0 ? (
          <p className="fact">
            This video has no scenes yet. Connect an agent to build it.
          </p>
        ) : (
          <SceneCards
            output={output}
            clips={mainClips}
            scenes={snapshot.scenes}
            stills={stills}
            pickedClipId={picked?.clip.id}
            shownClipId={props.shownClipId}
            framesPerSecond={framesPerSecond}
            onPick={props.onPickCard}
            onMove={edits.move}
          />
        )}
        {changes.voiceMayNotMatch ? (
          <p className="voice-note" role="status">
            The voice may not match the scenes now.
          </p>
        ) : undefined}
        {mainClips.length === 0 ? undefined : (
          <SceneActions
            picked={picked}
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
          rows={soundRowsOf({
            timeline: props.timeline,
            scenes: snapshot.scenes,
            assets: snapshot.assets,
          })}
          failure={changes.failureOf("sound")}
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
            selectedClipId={props.selectedClipId}
            onPick={props.onPick}
            onSeek={props.onSeek}
          />
        ) : undefined}
      </section>
    </>
  );
}
