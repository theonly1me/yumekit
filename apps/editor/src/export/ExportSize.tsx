import { exportScales, type ExportScale } from "./exportJobs.js";

export function ExportSize(props: {
  scale: ExportScale;
  isLocked: boolean;
  onScale: (scale: ExportScale) => void;
}) {
  return (
    <div className="export-size">
      <span className="field-label" id="export-size-label">
        Size
      </span>
      <div
        className="segments"
        role="group"
        aria-labelledby="export-size-label"
      >
        {exportScales.map((choice) => (
          <button
            key={choice.label}
            type="button"
            aria-pressed={props.scale === choice.scale}
            disabled={props.isLocked}
            onClick={() => {
              props.onScale(choice.scale);
            }}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <p className="fact">
        A smaller size exports faster and makes a smaller file.
      </p>
    </div>
  );
}
