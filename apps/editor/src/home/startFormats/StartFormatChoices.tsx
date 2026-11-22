import {
  startFormatCatalog,
  type StartFormatId,
} from "@yumekit/project/start-formats";
import "./startFormats.css";

export function StartFormatChoices(props: {
  chosen: StartFormatId;
  onChoose: (formatId: StartFormatId) => void;
}) {
  const chosenLine = startFormatCatalog.find(
    (format) => format.id === props.chosen,
  )?.line;
  return (
    <>
      <div
        className="segments format-choices"
        role="group"
        aria-label="Format"
        aria-describedby="format-line"
      >
        {startFormatCatalog.map((format) => (
          <button
            type="button"
            key={format.id}
            data-format={format.id}
            aria-pressed={props.chosen === format.id}
            onClick={() => {
              props.onChoose(format.id);
            }}
          >
            {format.name}
          </button>
        ))}
      </div>
      <p className="fact" id="format-line">
        {chosenLine}
      </p>
    </>
  );
}
