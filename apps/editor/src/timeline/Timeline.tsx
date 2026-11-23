import type { MouseEvent } from "react";
import type {
  Asset,
  Scene,
  Timeline as TimelineData,
} from "../engine/snapshot.js";
import { Ruler } from "./Ruler.js";
import { audioClipLabel, isCaptionTrack, trackLabel } from "./timelineFacts.js";
import { sceneNameById } from "../names/index.js";

export interface PickedClip {
  id: string;
  startFrame: number;
}

function clipStyleOf(options: {
  startFrame: number;
  durationFrames: number;
  lengthFrames: number;
}) {
  const { startFrame, durationFrames, lengthFrames } = options;
  return {
    left: `${String((startFrame / lengthFrames) * 100)}%`,
    width: `calc(${String((durationFrames / lengthFrames) * 100)}% - 2px)`,
  };
}

export function Timeline(props: {
  timeline: TimelineData;
  scenes: Scene[];
  assets: Asset[];
  lengthFrames: number;
  frame: number;
  framesPerSecond: number;
  selectedClipId: string | undefined;
  onPick: (clip: PickedClip) => void;
  onSeek: (frame: number) => void;
}) {
  const { timeline, scenes, assets, lengthFrames } = props;
  if (lengthFrames === 0) {
    return (
      <p className="fact">
        This output has no clips yet. Connect an agent to build it.
      </p>
    );
  }
  const seekFromRuler = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const share = Math.min(
      1,
      Math.max(0, (event.clientX - box.left) / box.width),
    );
    props.onSeek(Math.round(share * (lengthFrames - 1)));
  };
  const clipButton = (clip: {
    id: string;
    startFrame: number;
    durationFrames: number;
    label: string;
    kind: string;
  }) => (
    <button
      key={clip.id}
      type="button"
      className={`clip ${clip.kind}`}
      aria-current={clip.id === props.selectedClipId}
      title={clip.label}
      style={clipStyleOf({ ...clip, lengthFrames })}
      onClick={() => {
        props.onPick(clip);
      }}
    >
      {clip.label}
    </button>
  );
  return (
    <div className="tracks" aria-label="Timeline">
      <div className="track">
        <span />
        <Ruler
          lengthFrames={lengthFrames}
          framesPerSecond={props.framesPerSecond}
          onClick={seekFromRuler}
        />
      </div>
      {timeline.tracks.map((track) => {
        const isCaptions = isCaptionTrack({ track, scenes });
        return (
          <div className="track" key={track.id}>
            <span>{trackLabel(track.id)}</span>
            <div className="lane">
              {track.kind === "scene"
                ? track.clips.map((clip) =>
                    clipButton({
                      ...clip,
                      kind: isCaptions ? "narration" : "scene",
                      label: sceneNameById({
                        sceneId: clip.sceneId,
                        scenes,
                        assets: props.assets,
                      }),
                    }),
                  )
                : track.clips.map((clip) =>
                    clipButton({
                      ...clip,
                      kind: assets.some(
                        (asset) => asset.id === clip.assetId && asset.hasWords,
                      )
                        ? "narration"
                        : "music",
                      label: audioClipLabel({ clip, assets }),
                    }),
                  )}
            </div>
          </div>
        );
      })}
      <div className="playhead-layer" aria-hidden="true">
        <span
          className="playhead"
          style={{ left: `${String((props.frame / lengthFrames) * 100)}%` }}
        />
      </div>
    </div>
  );
}
