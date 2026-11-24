import type { Shot } from "@yumekit/project";

export const largestOpponentCount = 2;

const passageVerb =
  /\b(walks?|walking|wanders?|wandering|strolls?|strolling|stands?|standing|looks around|looking around|gazes?|gazing|explores?|exploring|arrives?|arriving|enters?|entering)\b/i;

const strikeVerb =
  /\b(strikes?|striking|slash(es)?|slashing|cuts? (through|down|into)|hits?|punch(es)?|kicks?|stabs?|swings? (the|his|her|a)|parr(y|ies)|blocks?|clash(es)?|smash(es)?|smashing|splits?|splitting)\b/i;

const closeSizes = new Set(["close-up", "extreme-close-up"]);

export function isFightShot(shot: Shot): boolean {
  return (shot.strikes ?? []).length > 0 || strikeVerb.test(shot.action);
}

function framingWarnings(shots: Shot[]): string[] {
  const warnings: string[] = [];
  let run: Shot[] = [];
  for (const shot of [...shots, undefined]) {
    const [first] = run;
    const same =
      shot !== undefined &&
      first?.camera.size === shot.camera.size &&
      first.camera.angle === shot.camera.angle;
    if (same) {
      run.push(shot);
      continue;
    }
    if (run.length > 2 && first !== undefined) {
      warnings.push(
        `${String(run.length)} shots in a row (${run.map((item) => item.id).join(", ")}) have the same size and angle: ${first.camera.size}, ${first.camera.angle}. Vary the size and the angle: a close shot of the eyes or the blade, a low angle for power, an over the shoulder shot.`,
      );
    }
    run = shot === undefined ? [] : [shot];
  }
  return warnings;
}

function openingWarnings(shots: Shot[]): string[] {
  const [first] = shots;
  if (first === undefined || !passageVerb.test(first.action)) return [];
  return [
    `The first shot "${first.id}" opens with a walk, a stand, or a look. Start late, inside an action: the first frame already moves.`,
  ];
}

function opponentCountOf(shot: Shot): number {
  const targets = [
    ...new Set((shot.strikes ?? []).map((strike) => strike.target)),
  ];
  const entries = typeof shot.startState === "string" ? [] : shot.startState;
  return targets.reduce(
    (...[sum, target]) =>
      sum + (entries.find((entry) => entry.castId === target)?.count ?? 1),
    0,
  );
}

function fightWarnings(shots: Shot[]): string[] {
  const fights = shots.filter(isFightShot);
  if (fights.length === 0) return [];
  const unnamed = fights
    .filter((shot) => (shot.strikes ?? []).length === 0)
    .map(
      (shot) =>
        `Shot "${shot.id}" has a strike in its action but no strikes. Name the target, the point of contact, the reaction of that target, and the source and path of each effect.`,
    );
  const crowded = fights
    .filter((shot) => opponentCountOf(shot) > largestOpponentCount)
    .map(
      (shot) =>
        `Shot "${shot.id}" fights ${String(opponentCountOf(shot))} opponents. Fight one or two: each needs its own design, place, attack, and reaction, or the fight reads as waving a sword at the air.`,
    );
  const hasClose = fights.some(
    (shot) =>
      (shot.strikes ?? []).length > 0 && closeSizes.has(shot.camera.size),
  );
  return [
    ...unnamed,
    ...crowded,
    ...(hasClose
      ? []
      : [
          "The fight has no close shot of a strike that lands. Add a close-up or an extreme close-up of the blade meeting its target, and cut on the strike.",
        ]),
  ];
}

export function directionWarningsOf(shots: Shot[]): string[] {
  return [
    ...framingWarnings(shots),
    ...openingWarnings(shots),
    ...fightWarnings(shots),
  ];
}
