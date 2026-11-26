import { scenesRowOf } from "@yumekit/project/scenes-row";
import type { MouseEvent } from "react";
import type { ChapterEdits } from "../chapters/chapterEdits.js";
import type { FilmChapters } from "../chapters/filmChapters.js";
import type { EngineClient } from "../engine/engineClient.js";
import type {
  SceneClip,
  Snapshot,
  Timeline as TimelineData,
} from "../engine/snapshot.js";
import { sceneNameById } from "../names/index.js";
import { musicTracksOf } from "../sound/soundRowFacts.js";
import { TakeTray } from "../takeTray/TakeTray.js";
import { trayItemsOf } from "../takeTray/trayItems.js";
import { ChapterLane } from "./ChapterLane.js";
import { MusicLane } from "./MusicLane.js";
import { Ruler } from "./Ruler.js";
import { SceneLane } from "./SceneLane.js";
import type { TimelineEdits } from "./timelineEdits.js";
import { StaticLane } from "./StaticLane.js";
import { trackLabel } from "./timelineFacts.js";
import "./timeline.css";

export interface PickedClip {
  id: string;
  startFrame: number;
}

export function Timeline(props: {
  client: EngineClient;
  snapshot: Snapshot;
  timeline: TimelineData;
  lengthFrames: number;
  frame: number;
  selectedClipId: string | undefined;
  pickedClip: SceneClip | undefined;
  film: FilmChapters;
  chapterEdits: ChapterEdits;
  edits: TimelineEdits;
  pickedChapterId: string | undefined;
  onPickChapter: (chapterId: string | undefined) => void;
  onDropSceneInChapter: (drop: { clipId: string; chapterId: string }) => void;
  onPick: (clip: PickedClip) => void;
  onSeek: (frame: number) => void;
}) {
  const { timeline, snapshot, lengthFrames, film, edits } = props;
  const { scenes, assets } = snapshot;
  const framesPerSecond = snapshot.project.framesPerSecond;
  if (lengthFrames === 0) {
    return (
      <p className="fact">
        This output has no clips yet. Connect an agent to build it.
      </p>
    );
  }
  const scale = { lengthFrames, framesPerSecond };
  const rowEnd = Math.max(
    0,
    ...film.cards.map(
      (card) => card.clip.startFrame + card.clip.durationFrames,
    ),
  );
  const rowTrackId = scenesRowOf({ tracks: timeline.tracks, scenes })?.id;
  const musicTracks = musicTracksOf({ timeline, assets });
  const seekFromRuler = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const share = Math.min(
      1,
      Math.max(0, (event.clientX - box.left) / box.width),
    );
    props.onSeek(Math.round(share * (lengthFrames - 1)));
  };
  const placeItem = (drop: { assetId: string; clip: SceneClip }) => {
    const item = trayItemsOf(snapshot).find(
      (each) => each.assetId === drop.assetId,
    );
    if (item !== undefined) {
      edits.placeItem({ item, clip: drop.clip, area: "timeline" });
    }
  };
  const laneOf = (track: TimelineData["tracks"][number]) => {
    if (track.id === rowTrackId) {
      return (
        <SceneLane
          film={film}
          titleOf={(clip) =>
            sceneNameById({ sceneId: clip.sceneId, scenes, assets })
          }
          scale={scale}
          selectedClipId={props.selectedClipId}
          chapterEdits={props.chapterEdits}
          edits={edits}
          onPick={props.onPick}
          onDropItem={placeItem}
        />
      );
    }
    const music = musicTracks.find((each) => each.id === track.id);
    if (music !== undefined) {
      return (
        <MusicLane
          track={music}
          assets={assets}
          scale={scale}
          endFrame={rowEnd}
          selectedClipId={props.selectedClipId}
          edits={edits}
          onPick={props.onPick}
        />
      );
    }
    return (
      <StaticLane
        track={track}
        scenes={scenes}
        assets={assets}
        lengthFrames={lengthFrames}
        selectedClipId={props.selectedClipId}
        onPick={props.onPick}
      />
    );
  };
  return (
    <div className="timeline-area">
      <TakeTray
        client={props.client}
        items={trayItemsOf(snapshot)}
        onPlace={(item) => {
          edits.placeItem({ item, clip: props.pickedClip, area: "timeline" });
        }}
      />
      <div className="tracks" aria-label="Timeline">
        <div className="track">
          <span>
            {snapshot.project.tempo === undefined
              ? ""
              : `${String(snapshot.project.tempo)} BPM`}
          </span>
          <Ruler
            lengthFrames={lengthFrames}
            framesPerSecond={framesPerSecond}
            tempo={snapshot.project.tempo}
            onClick={seekFromRuler}
          />
        </div>
        {film.isSplit ? (
          <div className="track">
            <span>Chapters</span>
            <ChapterLane
              film={film}
              scale={scale}
              pickedChapterId={props.pickedChapterId}
              edits={props.chapterEdits}
              onPickChapter={props.onPickChapter}
              onDropScene={props.onDropSceneInChapter}
            />
          </div>
        ) : undefined}
        {timeline.tracks.map((track) => (
          <div className="track" key={track.id}>
            <span>{trackLabel(track.id)}</span>
            {laneOf(track)}
          </div>
        ))}
        <div className="playhead-layer" aria-hidden="true">
          <span
            className="playhead"
            style={{ left: `${String((props.frame / lengthFrames) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
