import type { Scene, SceneClip } from "../engine/snapshot.js";
import { secondsText } from "../timeline/clock.js";

export function ScenePane(props: {
  clip: SceneClip | undefined;
  scene: Scene | undefined;
  framesPerSecond: number;
}) {
  const { clip, scene, framesPerSecond } = props;
  if (clip === undefined || scene === undefined) {
    return (
      <>
        <h2>Scene</h2>
        <p className="fact">
          Pick a scene in the scenes row or a scene clip in the timeline.
        </p>
      </>
    );
  }
  return (
    <>
      <h2>{scene.title}</h2>
      <p className="fact">
        {scene.source.kind === "kit" ? (
          <>
            Kit scene <strong>{scene.source.component}</strong>.
          </>
        ) : (
          "Custom scene with its own code."
        )}{" "}
        Starts at frame <strong>{clip.startFrame}</strong>, runs{" "}
        <strong>{clip.durationFrames}</strong> frames (
        {secondsText({ frames: clip.durationFrames, framesPerSecond })}).
      </p>
      <dl className="facts">
        <div>
          <dt>Scene id</dt>
          <dd>{scene.id}</dd>
        </div>
        <div>
          <dt>Clip id</dt>
          <dd>{clip.id}</dd>
        </div>
      </dl>
      <div className="group">
        <h3>Changes</h3>
        <p className="fact">
          The form to change this scene arrives in the next step. Until then,
          ask your agent for a change.
        </p>
      </div>
    </>
  );
}
