import {
  cameraMoveCatalog,
  type CameraMoveId,
} from "@yumekit/project/camera-moves";
import { useState } from "react";

const commonMoveIds: CameraMoveId[] = [
  "push-in",
  "pull-out",
  "orbit",
  "pan-left",
  "tracking",
  "drone-rise",
];

const noMoveLine = "The video model picks how the camera moves.";

export function CameraMovePicker(props: {
  chosen: CameraMoveId | undefined;
  onChoose: (cameraMoveId: CameraMoveId | undefined) => void;
}) {
  const [isAllShown, setAllShown] = useState(false);
  const shownMoves = cameraMoveCatalog.filter(
    (move) =>
      isAllShown || commonMoveIds.includes(move.id) || move.id === props.chosen,
  );
  const chosenMove = cameraMoveCatalog.find((move) => move.id === props.chosen);
  const hiddenCount = cameraMoveCatalog.length - shownMoves.length;
  return (
    <div className="field camera-moves">
      <span className="field-label" id="camera-move-label">
        Camera
      </span>
      <div
        className="camera-move-choices"
        role="group"
        aria-labelledby="camera-move-label"
      >
        <button
          type="button"
          className="camera-move"
          aria-pressed={props.chosen === undefined}
          onClick={() => {
            props.onChoose(undefined);
          }}
        >
          No camera move
        </button>
        {shownMoves.map((move) => (
          <button
            key={move.id}
            type="button"
            className="camera-move"
            aria-pressed={move.id === props.chosen}
            onClick={() => {
              props.onChoose(move.id);
            }}
          >
            {move.name}
          </button>
        ))}
        {isAllShown ? undefined : (
          <button
            type="button"
            className="camera-move more"
            aria-expanded={false}
            onClick={() => {
              setAllShown(true);
            }}
          >
            {`${String(hiddenCount)} more`}
          </button>
        )}
      </div>
      <p className="camera-move-line" aria-live="polite">
        {chosenMove?.line ?? noMoveLine}
      </p>
    </div>
  );
}
