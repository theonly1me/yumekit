import { useEffect, useState } from "react";

const quietestDecibels = -30;
const commitDelayMilliseconds = 400;

export function MusicVolume(props: {
  gainDecibels: number;
  disabled: boolean;
  onChange: (gainDecibels: number) => void;
}) {
  const { gainDecibels, onChange } = props;
  const [draft, setDraft] = useState<number>();

  useEffect(() => {
    if (draft === undefined || draft === gainDecibels) return;
    const timer = window.setTimeout(() => {
      onChange(draft);
      setDraft(undefined);
    }, commitDelayMilliseconds);
    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, gainDecibels, onChange]);

  const shown = draft ?? gainDecibels;
  return (
    <label className="volume">
      How loud the music is under the voice
      <input
        type="range"
        min={quietestDecibels}
        max={0}
        step={1}
        value={Math.max(quietestDecibels, Math.min(0, shown))}
        disabled={props.disabled}
        aria-valuetext={`${String(shown)} decibels`}
        onChange={(event) => {
          setDraft(Number(event.currentTarget.value));
        }}
      />
      <span className="volume-ends fact" aria-hidden="true">
        <span>Quiet</span>
        <span>As loud as the voice</span>
      </span>
    </label>
  );
}
