import type { SceneClip } from "../engine/snapshot.js";
import { LengthStepper } from "./LengthStepper.js";

export interface PickedCard {
  clip: SceneClip;
  number: number;
  title: string;
}

export function SceneActions(props: {
  picked: PickedCard | undefined;
  isVideo: boolean;
  isChatRunning: boolean;
  framesPerSecond: number;
  onEditText: () => void;
  onLength: (durationFrames: number) => void;
  onMakeClip: () => void;
  onBackToGraphics: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { picked } = props;
  if (picked === undefined) {
    return (
      <p className="fact scene-hint">
        Pick a scene to change it. Drag a scene to move it.
      </p>
    );
  }
  return (
    <div
      className="scene-actions"
      role="group"
      aria-label={`Actions for scene ${String(picked.number)}`}
    >
      <p className="scene-actions-name">
        Scene {picked.number}: {picked.title}
      </p>
      <button type="button" onClick={props.onEditText}>
        Edit text
      </button>
      <LengthStepper
        durationFrames={picked.clip.durationFrames}
        framesPerSecond={props.framesPerSecond}
        onLength={props.onLength}
      />
      <button type="button" onClick={props.onMakeClip}>
        Make a real video clip
      </button>
      {props.isVideo ? (
        <button
          type="button"
          disabled={props.isChatRunning}
          onClick={props.onBackToGraphics}
        >
          Back to graphics
        </button>
      ) : undefined}
      <button type="button" onClick={props.onDuplicate}>
        Duplicate
      </button>
      <button type="button" onClick={props.onDelete}>
        Delete
      </button>
    </div>
  );
}
