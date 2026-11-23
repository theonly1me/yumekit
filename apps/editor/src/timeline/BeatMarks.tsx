import { framesPerBeatOf } from "@yumekit/project/tempo";

const mostMarks = 160;
const beatsInBar = 4;

export function BeatMarks(props: {
  tempo: number;
  framesPerSecond: number;
  lengthFrames: number;
}) {
  const { lengthFrames } = props;
  const framesPerBeat = framesPerBeatOf({
    tempo: props.tempo,
    framesPerSecond: props.framesPerSecond,
  });
  const beatCount = Math.ceil(lengthFrames / framesPerBeat);
  const step = beatCount > mostMarks ? beatsInBar : 1;
  const beats: number[] = [];
  for (let beat = 0; beat < beatCount; beat += step) {
    beats.push(beat);
  }
  return (
    <span className="beats" aria-hidden="true" data-testid="beat-marks">
      {beats.map((beat) => (
        <span
          key={beat}
          className={beat % beatsInBar === 0 ? "beat bar" : "beat"}
          style={{
            left: `${String(((beat * framesPerBeat) / lengthFrames) * 100)}%`,
          }}
        />
      ))}
    </span>
  );
}
