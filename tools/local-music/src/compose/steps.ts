export interface StepHit {
  step: number;
  symbol: string;
  lengthSteps: number;
  velocity: number;
}

const drumVelocities: Record<string, number> = { X: 1, x: 0.78, o: 0.45 };
const toneVelocity = 0.85;

export function hitsOf(steps: string): StepHit[] {
  const symbols = Array.from({ length: steps.length }, (...[, index]) =>
    steps.charAt(index),
  );
  const hits: StepHit[] = [];
  symbols.forEach((...[symbol, step]) => {
    if (symbol === "." || symbol === "-") return;
    let lengthSteps = 1;
    while (symbols[step + lengthSteps] === "-") lengthSteps += 1;
    hits.push({
      step,
      symbol,
      lengthSteps,
      velocity: drumVelocities[symbol] ?? toneVelocity,
    });
  });
  return hits;
}
