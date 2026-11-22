import { sceneSuggestions, starterSuggestions } from "./requestTexts.js";

export function Suggestions(props: {
  hasScenes: boolean;
  isRunning: boolean;
  onSend: (text: string) => void;
  onFill: (text: string) => void;
}) {
  if (!props.hasScenes) {
    return (
      <div className="suggestions" role="group" aria-label="Ideas to start">
        {starterSuggestions.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => {
              props.onFill(text);
            }}
          >
            {`${text.trim()} ...`}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="suggestions" role="group" aria-label="Suggestions">
      {sceneSuggestions.map((text) => (
        <button
          key={text}
          type="button"
          disabled={props.isRunning}
          onClick={() => {
            props.onSend(text);
          }}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
