const defaultStiffness = 100;
const defaultDamping = 10;
const defaultMass = 1;

interface Oscillator {
  displacement: number;
  naturalFrequency: number;
  dampingRatio: number;
  seconds: number;
}

function underdamped(oscillator: Oscillator): number {
  const { displacement, naturalFrequency, dampingRatio, seconds } = oscillator;
  const decay = dampingRatio * naturalFrequency;
  const dampedFrequency = naturalFrequency * Math.sqrt(1 - dampingRatio ** 2);
  return (
    Math.exp(-decay * seconds) *
    (displacement * Math.cos(dampedFrequency * seconds) +
      ((decay * displacement) / dampedFrequency) *
        Math.sin(dampedFrequency * seconds))
  );
}

function criticallyDamped(oscillator: Oscillator): number {
  const { displacement, naturalFrequency, seconds } = oscillator;
  return (
    displacement *
    (1 + naturalFrequency * seconds) *
    Math.exp(-naturalFrequency * seconds)
  );
}

function overdamped(oscillator: Oscillator): number {
  const { displacement, naturalFrequency, dampingRatio, seconds } = oscillator;
  const spread = Math.sqrt(dampingRatio ** 2 - 1);
  const slowRate = -naturalFrequency * (dampingRatio - spread);
  const fastRate = -naturalFrequency * (dampingRatio + spread);
  const slowWeight = (displacement * fastRate) / (fastRate - slowRate);
  const fastWeight = (-displacement * slowRate) / (fastRate - slowRate);
  return (
    slowWeight * Math.exp(slowRate * seconds) +
    fastWeight * Math.exp(fastRate * seconds)
  );
}

function displacementAt(oscillator: Oscillator): number {
  if (oscillator.dampingRatio < 1) {
    return underdamped(oscillator);
  }
  if (oscillator.dampingRatio === 1) {
    return criticallyDamped(oscillator);
  }
  return overdamped(oscillator);
}

export function spring(options: {
  frame: number;
  startFrame: number;
  framesPerSecond: number;
  from: number;
  to: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
}): number {
  const { frame, startFrame, framesPerSecond, from, to } = options;
  if (frame <= startFrame) {
    return from;
  }
  const stiffness = options.stiffness ?? defaultStiffness;
  const damping = options.damping ?? defaultDamping;
  const mass = options.mass ?? defaultMass;
  const displacement = displacementAt({
    displacement: from - to,
    naturalFrequency: Math.sqrt(stiffness / mass),
    dampingRatio: damping / (2 * Math.sqrt(stiffness * mass)),
    seconds: (frame - startFrame) / framesPerSecond,
  });
  return to + displacement;
}
