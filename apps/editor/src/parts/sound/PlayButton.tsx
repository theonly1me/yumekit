import type { EngineClient } from "../../engine/engineClient.js";
import { useSoundPlayer, type SoundPiece } from "./useSoundPlayer.js";
import { Wave } from "./Wave.js";

export function PlayButton(props: {
  client: EngineClient;
  piece: SoundPiece;
  label: string;
  withWave?: boolean;
}) {
  const sound = useSoundPlayer({ client: props.client, piece: props.piece });
  return (
    <>
      <button
        type="button"
        className="play-sound"
        aria-label={`${sound.isPlaying ? "Pause" : "Play"} ${props.label}`}
        aria-pressed={sound.isPlaying}
        disabled={!sound.isReady}
        onClick={sound.toggle}
      >
        {sound.isPlaying ? "Pause" : "Play"}
      </button>
      {props.withWave === true ? (
        <Wave url={sound.url} played={sound.played} />
      ) : undefined}
    </>
  );
}
