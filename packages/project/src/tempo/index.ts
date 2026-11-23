export const lowestTempo = 60;
export const highestTempo = 200;

export interface TempoGrid {
  tempo: number;
  framesPerSecond: number;
}

export function framesPerBeatOf(grid: TempoGrid): number {
  return (grid.framesPerSecond * 60) / grid.tempo;
}

export function frameOfBeat(options: {
  grid: TempoGrid;
  beat: number;
}): number {
  return Math.round(options.beat * framesPerBeatOf(options.grid));
}

export function beatOfFrame(options: {
  grid: TempoGrid;
  frame: number;
}): number {
  return options.frame / framesPerBeatOf(options.grid);
}

export function isWholeOrHalfBeat(beats: number): boolean {
  return Number.isInteger(beats * 2);
}

export function beatFramesOfSpan(options: {
  grid: TempoGrid;
  startBeat: number;
  durationBeats: number;
}): { startFrame: number; durationFrames: number } {
  const { grid, startBeat, durationBeats } = options;
  const startFrame = frameOfBeat({ grid, beat: startBeat });
  const endFrame = frameOfBeat({ grid, beat: startBeat + durationBeats });
  return { startFrame, durationFrames: endFrame - startFrame };
}

export function tempoGridOf(project: {
  tempo?: number;
  framesPerSecond: number;
}): TempoGrid | undefined {
  return project.tempo === undefined
    ? undefined
    : { tempo: project.tempo, framesPerSecond: project.framesPerSecond };
}
