export function clockText(options: {
  frame: number;
  framesPerSecond: number;
}): string {
  const seconds = Math.floor(options.frame / options.framesPerSecond);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function secondsText(options: {
  frames: number;
  framesPerSecond: number;
}): string {
  const seconds =
    Math.round((options.frames / options.framesPerSecond) * 10) / 10;
  return `${String(seconds)} ${seconds === 1 ? "second" : "seconds"}`;
}
