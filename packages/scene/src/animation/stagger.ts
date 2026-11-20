export function stagger(options: {
  index: number;
  startFrame: number;
  eachFrames: number;
}): number {
  return options.startFrame + options.index * options.eachFrames;
}
