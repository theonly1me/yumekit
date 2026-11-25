export const hitWindowSeconds = 0.02;

const lookBackWindows = 10;
const riseDecibels = 9;
const belowLoudDecibels = 14;
const shortestGapSeconds = 0.3;
const largestHitCount = 48;
const silentDecibels = -90;
const loudShare = 0.95;

function levelsOf(options: {
  samples: Float32Array;
  sampleRate: number;
}): number[] {
  const size = Math.round(options.sampleRate * hitWindowSeconds);
  const levels: number[] = [];
  for (let start = 0; start + size <= options.samples.length; start += size) {
    let sum = 0;
    for (let index = start; index < start + size; index += 1) {
      const value = options.samples[index] ?? 0;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / size);
    levels.push(
      rms <= 0
        ? silentDecibels
        : Math.max(silentDecibels, 20 * Math.log10(rms)),
    );
  }
  return levels;
}

function loudLevelOf(levels: number[]): number {
  const sorted = levels.toSorted((...[first, second]) => first - second);
  return sorted[Math.floor((sorted.length - 1) * loudShare)] ?? silentDecibels;
}

interface Candidate {
  seconds: number;
  rise: number;
}

function candidatesOf(levels: number[]): Candidate[] {
  const loud = loudLevelOf(levels);
  const found: Candidate[] = [];
  for (let index = lookBackWindows; index < levels.length; index += 1) {
    const level = levels[index] ?? silentDecibels;
    const before = levels.slice(index - lookBackWindows, index);
    const background =
      before.reduce((...[sum, value]) => sum + value, 0) / before.length;
    const rise = level - background;
    const isOnset = rise >= riseDecibels && level >= loud - belowLoudDecibels;
    const previous = found.at(-1);
    const seconds = index * hitWindowSeconds;
    if (!isOnset) continue;
    if (
      previous !== undefined &&
      seconds - previous.seconds < shortestGapSeconds
    ) {
      continue;
    }
    found.push({ seconds, rise });
  }
  return found;
}

export function musicHitsOf(options: {
  samples: Float32Array;
  sampleRate: number;
}): number[] {
  return candidatesOf(levelsOf(options))
    .toSorted((...[first, second]) => second.rise - first.rise)
    .slice(0, largestHitCount)
    .map((candidate) => Math.round(candidate.seconds * 100) / 100)
    .toSorted((...[first, second]) => first - second);
}
