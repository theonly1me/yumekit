const defaultCharactersPerSecond = 24;
const defaultBlinkSeconds = 0.53;

export function typed(options: {
  text: string;
  frame: number;
  framesPerSecond: number;
  startFrame?: number;
  charactersPerSecond?: number;
  blinkSeconds?: number;
}): { shown: string; cursorVisible: boolean; done: boolean } {
  const characters = Array.from(options.text);
  const elapsedSeconds =
    (options.frame - (options.startFrame ?? 0)) / options.framesPerSecond;
  const shownCount = Math.min(
    characters.length,
    Math.max(
      0,
      Math.floor(
        elapsedSeconds *
          (options.charactersPerSecond ?? defaultCharactersPerSecond),
      ),
    ),
  );
  const done = shownCount >= characters.length;
  const blinkSeconds = options.blinkSeconds ?? defaultBlinkSeconds;
  const blinkPhase = Math.floor(Math.max(0, elapsedSeconds) / blinkSeconds);
  return {
    shown: characters.slice(0, shownCount).join(""),
    cursorVisible: !done || blinkPhase % 2 === 0,
    done,
  };
}
