import { StepFrame } from "../parts/frame/StepFrame.js";

export function TogetherView(props: {
  locked: boolean;
  onOpenEditor: () => void;
}) {
  return (
    <StepFrame
      title="The video"
      titleId="step-view-together"
      locked={props.locked}
    >
      <p className="fact lead">
        The video is ready. Open the editor to watch it, to change a scene, and
        to export it.
      </p>
      <div className="part-actions">
        <button type="button" className="primary" onClick={props.onOpenEditor}>
          Open the editor
        </button>
      </div>
    </StepFrame>
  );
}
