import type { Asset, Scene, Track } from "../engine/snapshot.js";
import { sceneNameById } from "../names/index.js";
import { laneStyleOf } from "./pointerDrag.js";
import { audioClipLabel, isCaptionTrack } from "./timelineFacts.js";

interface LaneClip {
  id: string;
  startFrame: number;
  durationFrames: number;
  label: string;
  kind: string;
}

export function StaticLane(props: {
  track: Track;
  scenes: Scene[];
  assets: Asset[];
  lengthFrames: number;
  selectedClipId: string | undefined;
  onPick: (clip: { id: string; startFrame: number }) => void;
}) {
  const { track, scenes, assets } = props;
  const isCaptions = isCaptionTrack({ track, scenes });
  const clips: LaneClip[] =
    track.kind === "scene"
      ? track.clips.map((clip) => ({
          ...clip,
          kind: isCaptions ? "narration" : "scene",
          label: sceneNameById({ sceneId: clip.sceneId, scenes, assets }),
        }))
      : track.clips.map((clip) => ({
          ...clip,
          kind: assets.some(
            (asset) => asset.id === clip.assetId && asset.hasWords,
          )
            ? "narration"
            : "music",
          label: audioClipLabel({ clip, assets }),
        }));
  return (
    <div className="lane">
      {clips.map((clip) => (
        <button
          key={clip.id}
          type="button"
          className={`clip ${clip.kind}`}
          aria-current={clip.id === props.selectedClipId}
          title={clip.label}
          style={laneStyleOf({ ...clip, lengthFrames: props.lengthFrames })}
          onClick={() => {
            props.onPick(clip);
          }}
        >
          {clip.label}
        </button>
      ))}
    </div>
  );
}
