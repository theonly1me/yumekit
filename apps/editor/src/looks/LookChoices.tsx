import { looks, type LookId } from "@yumekit/scene-kit";
import { usePictureScale } from "./usePictureScale.js";
import { pictureOutput, useLookPicture } from "./useLookPicture.js";
import "./looks.css";

const pictureHeading = "Your idea, as a video.";

function LookPicture(props: { look: LookId }) {
  const { hostRef, state } = useLookPicture({
    look: props.look,
    heading: pictureHeading,
  });
  const { frameRef, scale } = usePictureScale(pictureOutput.widthPixels);
  return (
    <span
      ref={frameRef}
      className="look-picture"
      data-state={state}
      aria-hidden="true"
    >
      <span
        ref={hostRef}
        className="look-stage"
        style={{
          width: pictureOutput.widthPixels,
          height: pictureOutput.heightPixels,
          transform: `scale(${String(scale)})`,
        }}
      />
      {state === "failed" ? (
        <span className="look-missing">No picture</span>
      ) : undefined}
    </span>
  );
}

export function LookChoices(props: {
  chosen: string;
  onChoose: (look: LookId) => void;
  isBusy?: boolean;
}) {
  const chosenLine = looks.find((look) => look.id === props.chosen)?.line;
  return (
    <div className="look-group">
      <div className="look-choices" role="group" aria-label="Look">
        {looks.map((look) => (
          <button
            type="button"
            className="look-choice"
            key={look.id}
            data-look={look.id}
            aria-pressed={props.chosen === look.id}
            aria-describedby={`look-line-${look.id}`}
            disabled={props.isBusy === true}
            onClick={() => {
              props.onChoose(look.id);
            }}
          >
            <LookPicture look={look.id} />
            <span className="look-name">{look.label}</span>
            <span id={`look-line-${look.id}`} className="visually-hidden">
              {look.line}
            </span>
          </button>
        ))}
      </div>
      {chosenLine === undefined ? undefined : (
        <p className="fact look-line">{chosenLine}</p>
      )}
    </div>
  );
}
