import { useMemo, useState } from "react";
import { chapterEditsOf } from "../chapters/chapterEdits.js";
import { filmChaptersOf } from "../chapters/filmChapters.js";
import { changeStartOf } from "../chat/requestTexts.js";
import type { EngineClient } from "../engine/engineClient.js";
import type {
  Output,
  SceneClip,
  Snapshot,
  Timeline as TimelineData,
} from "../engine/snapshot.js";
import type { PickedCard } from "../scenes/SceneActions.js";
import type { SceneEdits } from "../scenes/sceneEdits.js";
import { ScenesRow } from "../scenes/ScenesRow.js";
import type { DirectChanges } from "../scenes/useDirectChanges.js";
import { useSceneStills } from "../scenes/useSceneStills.js";
import { SoundRows } from "../sound/SoundRows.js";
import { soundRowsOf, type SoundPartName } from "../sound/soundRowFacts.js";
import { useSoundNotes } from "../sound/useSoundNotes.js";
import { trayItemsOf } from "../takeTray/trayItems.js";
import { Timeline, type PickedClip } from "../timeline/Timeline.js";
import { timelineEditsOf } from "../timeline/timelineEdits.js";
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
  const { client, snapshot, output, mainClips, changes, edits } = props;
  const { editorChat } = props;
  const [pickedChapterId, setPickedChapterId] = useState<string>();
  const film = useMemo(
    () => filmChaptersOf({ snapshot, clips: mainClips }),
    [snapshot, mainClips],
  );
  const chapterEdits = chapterEditsOf({ changes, film, sceneEdits: edits });
  const timelineEdits = timelineEditsOf({
    changes,
    outputId: output.id,
    film,
  });
  const stills = useSceneStills({
    client,
    snapshot,
    output,
    clips: mainClips,
  });
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
  const dropSceneInChapter = (drop: { clipId: string; chapterId: string }) => {
    const card = film.cards.find((each) => each.clip.id === drop.clipId);
    if (card === undefined) return;
    chapterEdits.dropSceneInChapter({ card, chapterId: drop.chapterId });
  };
  const timelineFailure = changes.failureOf("timeline");
  return (
    <>
      <ScenesRow
        snapshot={snapshot}
        context={{
          outputId: output.id,
          scenes: snapshot.scenes,
          assets: snapshot.assets,
          stills,
          pickedClipId: props.picked?.clip.id,
          shownClipId: props.shownClipId,
          framesPerSecond: snapshot.project.framesPerSecond,
        }}
        film={film}
        picked={props.picked}
        changes={changes}
        edits={edits}
        chapterEdits={chapterEdits}
        editorChat={editorChat}
        pickedChapterId={pickedChapterId}
        onPickChapter={setPickedChapterId}
        onDropSceneInChapter={dropSceneInChapter}
        onDropItem={({ assetId, clip }) => {
          const item = trayItemsOf(snapshot).find(
            (each) => each.assetId === assetId,
          );
          if (item !== undefined) {
            timelineEdits.placeItem({ item, clip, area: "scenes" });
          }
        }}
        onPickCard={props.onPickCard}
        onEditText={props.onEditText}
        onMakeClip={props.onMakeClip}
      />
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
            client={client}
            snapshot={snapshot}
            timeline={props.timeline}
            lengthFrames={props.lengthFrames}
            frame={props.frame}
            selectedClipId={props.selectedClipId}
            pickedClip={props.picked?.clip}
            film={film}
            chapterEdits={chapterEdits}
            edits={timelineEdits}
            pickedChapterId={pickedChapterId}
            onPickChapter={setPickedChapterId}
            onDropSceneInChapter={dropSceneInChapter}
            onPick={props.onPick}
            onSeek={props.onSeek}
          />
        ) : undefined}
        {timelineFailure === undefined ? undefined : (
          <p className="change-failure" role="alert">
            {timelineFailure}
          </p>
        )}
      </section>
    </>
  );
}
