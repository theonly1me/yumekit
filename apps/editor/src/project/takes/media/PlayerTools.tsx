const speeds = [0.25, 0.5, 1];

export function PlayerTools(props: {
  speed: number;
  onSpeed: (speed: number) => void;
  onStep: (frames: number) => void;
}) {
  return (
    <div className="large-tools">
      <button
        type="button"
        onClick={() => {
          props.onStep(-1);
        }}
      >
        One frame back
      </button>
      <button
        type="button"
        onClick={() => {
          props.onStep(1);
        }}
      >
        One frame on
      </button>
      <span className="segments" role="group" aria-label="Speed">
        {speeds.map((each) => (
          <button
            key={each}
            type="button"
            aria-pressed={each === props.speed}
            onClick={() => {
              props.onSpeed(each);
            }}
          >
            {each} x
          </button>
        ))}
      </span>
    </div>
  );
}
