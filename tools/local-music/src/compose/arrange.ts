import type { StyleDefinition } from "../styles/styleTypes.ts";
import { endingNotesOf } from "./ending.ts";
import { chordOfBar } from "./harmony.ts";
import { pitchesOf } from "./pitches.ts";
import { chanceOf, pickOf } from "./random.ts";
import type { Chord, Layer, Note } from "./score.ts";
import { hitsOf } from "./steps.ts";
import { energyAt, type Timing } from "./timing.ts";
import { tiedNotesOf } from "./ties.ts";

export interface ArrangeRequest {
  style: StyleDefinition;
  timing: Timing;
  seed: number;
  energy: readonly number[];
}

interface BarPlan {
  bar: number;
  energy: number;
  layers: Layer[];
  isLift: boolean;
}

const steadyParts = new Set(["kick", "pad", "bass"]);

function barPlansOf(request: ArrangeRequest): BarPlan[] {
  const { style, timing, energy } = request;
  const energies = Array.from(
    { length: timing.barsBeforeEnd + 1 },
    (...[, bar]) =>
      energyAt({
        energy,
        share: ((bar + 0.5) * timing.barSeconds) / timing.durationSeconds,
      }),
  );
  const layersAt = (barEnergy: number) =>
    style.layers.filter(
      (layer) =>
        barEnergy >= layer.from && barEnergy < (layer.until ?? Infinity),
    );
  return energies.slice(0, timing.barsBeforeEnd).map((...[barEnergy, bar]) => {
    const nextEnergy = energies[bar + 1] ?? barEnergy;
    const isLast = bar === timing.barsBeforeEnd - 1;
    const breathes =
      isLast &&
      style.lift.breathBeforeEnd &&
      timing.endHitSeconds !== undefined;
    return {
      bar,
      energy: barEnergy,
      layers: layersAt(barEnergy).filter(
        (layer) => !breathes || layer.part === "pad",
      ),
      isLift: isLast
        ? timing.endHitSeconds !== undefined
        : layersAt(nextEnergy).length > layersAt(barEnergy).length,
    };
  });
}

function stepsOf(options: {
  request: ArrangeRequest;
  plan: BarPlan;
  layer: Layer;
}): string {
  const { request, plan, layer } = options;
  if (plan.isLift && layer.fill !== undefined) return layer.fill;
  if (plan.bar % 4 === 3 && layer.turn !== undefined) return layer.turn;
  return pickOf({
    seed: request.seed,
    key: `steps-${layer.part}-${String(layer.from)}`,
    index: layer.vary === true ? Math.floor(plan.bar / 4) : 0,
    items: layer.steps,
  });
}

function layerNotesOf(options: {
  request: ArrangeRequest;
  plan: BarPlan;
  layer: Layer;
  chord: Chord;
  keyRoot: number;
}): Note[] {
  const { request, plan, layer } = options;
  const { timing, style, seed } = request;
  const barStart = plan.bar * timing.barSeconds;
  return hitsOf(stepsOf(options)).flatMap((...[hit, hitIndex]) => {
    const key = `${layer.part}-${String(plan.bar)}`;
    const swing = hit.step % 2 === 1 ? style.swing * timing.stepSeconds : 0;
    const loose = steadyParts.has(layer.part)
      ? 0
      : (chanceOf({ seed, key: `time-${key}`, index: hitIndex }) - 0.5) *
        2 *
        style.looseSeconds;
    const lift = 0.78 + 0.22 * plan.energy;
    const spread =
      1 +
      (chanceOf({ seed, key: `velocity-${key}`, index: hitIndex }) - 0.5) *
        0.12;
    return pitchesOf({
      style,
      part: layer.part,
      symbol: hit.symbol,
      chord: options.chord,
      keyRoot: options.keyRoot,
    }).map((pitch) => ({
      part: layer.part,
      startSeconds: Math.max(
        0,
        barStart + hit.step * timing.stepSeconds + swing + loose,
      ),
      lengthSeconds: hit.lengthSteps * timing.stepSeconds,
      pitch,
      velocity: Math.min(1, hit.velocity * lift * spread),
    }));
  });
}

function liftNotesOf(options: {
  request: ArrangeRequest;
  plan: BarPlan;
  previous: BarPlan | undefined;
  next: BarPlan | undefined;
}): Note[] {
  const { request, plan, previous, next } = options;
  const { style, timing } = request;
  const barStart = plan.bar * timing.barSeconds;
  const notes: Note[] = [];
  const nextEnergy = next?.energy ?? plan.energy;
  if (plan.isLift && style.lift.riser && nextEnergy >= 0.45) {
    notes.push({
      part: "riser",
      startSeconds: barStart,
      lengthSeconds: timing.barSeconds,
      pitch: 60,
      velocity: 0.45 + 0.55 * nextEnergy,
    });
  }
  const rose =
    previous !== undefined && plan.layers.length > previous.layers.length;
  if (rose && previous.isLift && style.lift.crash && plan.energy >= 0.55) {
    notes.push({
      part: "crash",
      startSeconds: barStart,
      lengthSeconds: timing.barSeconds,
      pitch: 60,
      velocity: 0.6 + 0.4 * plan.energy,
    });
  }
  return notes;
}

export function arrange(request: ArrangeRequest): Note[] {
  const { style, seed, timing } = request;
  const keyRoot = pickOf({ seed, key: "key", items: style.keyRoots });
  const progression = pickOf({
    seed,
    key: "progression",
    items: style.progressions,
  });
  const plans = barPlansOf(request);
  const notes = plans.flatMap((...[plan, index]) => {
    const chord = chordOfBar({
      progression,
      barsPerChord: style.barsPerChord,
      bar: plan.bar,
    });
    return [
      ...plan.layers.flatMap((layer) =>
        layerNotesOf({ request, plan, layer, chord, keyRoot }),
      ),
      ...liftNotesOf({
        request,
        plan,
        previous: plans[index - 1],
        next: plans[index + 1],
      }),
    ];
  });
  const endSeconds = timing.endHitSeconds ?? timing.durationSeconds;
  const kept = tiedNotesOf(notes)
    .filter((note) => note.startSeconds < endSeconds)
    .map((note) => ({
      ...note,
      lengthSeconds: Math.min(
        note.lengthSeconds,
        endSeconds - note.startSeconds,
      ),
    }));
  const tonic = progression.find((chord) => chord.root === 0) ?? progression[0];
  if (tonic === undefined) return kept;
  return [...kept, ...endingNotesOf({ request, chord: tonic, keyRoot })];
}
