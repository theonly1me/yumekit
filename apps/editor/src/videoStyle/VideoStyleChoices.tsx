import { videoStyleChoices, type VideoStyleId } from "./videoStyles.js";
import "./videoStyle.css";

export function VideoStyleChoices(props: {
  chosen: VideoStyleId;
  isOff?: boolean;
  onChoose: (videoStyle: VideoStyleId) => void;
}) {
  return (
    <div
      className="style-choices"
      role="group"
      aria-label="How the video is made"
    >
      {videoStyleChoices.map((choice) => (
        <button
          type="button"
          className="style-choice"
          key={choice.id}
          data-video-style={choice.id}
          aria-pressed={props.chosen === choice.id}
          disabled={props.isOff === true}
          onClick={() => {
            props.onChoose(choice.id);
          }}
        >
          <span className="style-choice-name">{choice.name}</span>
          <em>{choice.line}</em>
        </button>
      ))}
    </div>
  );
}
