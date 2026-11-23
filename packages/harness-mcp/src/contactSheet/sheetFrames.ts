export const mostSheetFrames = 60;

export function sheetFramesOf(options: {
  lengthFrames: number;
  framesPerSecond: number;
  everySeconds: number;
}): { frames: number[]; everySeconds: number } {
  const { lengthFrames, framesPerSecond } = options;
  const lengthSeconds = lengthFrames / framesPerSecond;
  const everySeconds = Math.max(
    options.everySeconds,
    Math.ceil((lengthSeconds / mostSheetFrames) * 10) / 10,
  );
  const frames: number[] = [];
  for (let step = 0; frames.length < mostSheetFrames; step += 1) {
    const frame = Math.round(step * everySeconds * framesPerSecond);
    if (frame >= lengthFrames) break;
    frames.push(frame);
  }
  return { frames, everySeconds };
}
