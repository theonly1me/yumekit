export function clockText(options: {
  frame: number;
  framesPerSecond: number;
}): string {
  const seconds = options.frame / options.framesPerSecond;
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds % 60).toFixed(2).padStart(5, "0");
  return `${String(minutes)}:${rest}`;
}

export function secondsText(options: {
  frames: number;
  framesPerSecond: number;
}): string {
  return `${(options.frames / options.framesPerSecond).toFixed(1)} s`;
}
