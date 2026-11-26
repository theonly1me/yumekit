import { useState } from "react";
import { projectLengths, type ProjectLength } from "./homeApi.js";
import { PlatformChoices } from "./PlatformChoices.js";
import { lengthLabelOf, placesLineOf } from "./startTexts.js";

export function StartPlaces(props: {
  platformIds: string[];
  length: ProjectLength;
  onToggle: (platformId: string) => void;
  onLength: (length: ProjectLength) => void;
}) {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className="start-places">
      <p className="fact">
        {placesLineOf(props)}{" "}
        <button
          type="button"
          className="link"
          aria-expanded={isOpen}
          aria-controls="start-places-choices"
          onClick={() => {
            setOpen(!isOpen);
          }}
        >
          {isOpen ? "Done" : "Change"}
        </button>
      </p>
      {isOpen ? (
        <div className="start-places-choices" id="start-places-choices">
          <div className="start-group">
            <h2>Where will it go?</h2>
            <p className="fact">
              Pick one or more. You get one video for each, in its own shape.
            </p>
            <PlatformChoices
              chosen={props.platformIds}
              onToggle={props.onToggle}
            />
          </div>
          <div className="start-group">
            <h2>How long?</h2>
            <div className="segments" role="group" aria-label="Length">
              {projectLengths.map((length) => (
                <button
                  type="button"
                  key={length}
                  aria-pressed={props.length === length}
                  onClick={() => {
                    props.onLength(length);
                  }}
                >
                  {lengthLabelOf(length)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : undefined}
    </div>
  );
}
