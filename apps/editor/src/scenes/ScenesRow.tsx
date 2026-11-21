import type { Output, Scene, SceneClip } from "../engine/snapshot.js";
import { secondsText } from "../timeline/clock.js";
import { stillKey } from "./useSceneStills.js";

function frameWidthOf(output: Output): string {
  if (output.widthPixels > output.heightPixels) return "100%";
  return output.widthPixels === output.heightPixels ? "62%" : "46%";
}

export function ScenesRow(props: {
  output: Output;
  clips: SceneClip[];
  scenes: Scene[];
  stills: ReadonlyMap<string, string>;
  selectedClipId: string | undefined;
  framesPerSecond: number;
  onPick: (clip: SceneClip) => void;
}) {
  const { output, clips, scenes, stills, framesPerSecond } = props;
  if (clips.length === 0) {
    return (
      <p className="lower-empty">
        This output has no scenes yet. Connect an agent to build it.
      </p>
    );
  }
  return (
    <ol className="panels" aria-label="Scenes">
      {clips.map((...[clip, index]) => {
        const title =
          scenes.find((scene) => scene.id === clip.sceneId)?.title ??
          clip.sceneId;
        const still = stills.get(
          stillKey({ outputId: output.id, clipId: clip.id }),
        );
        return (
          <li key={clip.id}>
            <button
              type="button"
              className="panel"
              aria-current={clip.id === props.selectedClipId}
              onClick={() => {
                props.onPick(clip);
              }}
            >
              <span
                className="panel-frame"
                style={{
                  aspectRatio: `${String(output.widthPixels)} / ${String(output.heightPixels)}`,
                  width: frameWidthOf(output),
                }}
              >
                {still === undefined ? undefined : <img src={still} alt="" />}
              </span>
              <span className="panel-caption">
                <span className="panel-title">
                  {index + 1}&nbsp;&nbsp;{title}
                </span>
                <span>
                  {secondsText({
                    frames: clip.durationFrames,
                    framesPerSecond,
                  })}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
