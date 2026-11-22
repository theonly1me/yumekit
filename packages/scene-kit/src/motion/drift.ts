import { seededRandom } from "@yumekit/scene";

export const driftKinds = ["scale", "move", "turn"] as const;

export type DriftKind = (typeof driftKinds)[number];

export interface DriftPose {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  transform: string;
}

const limitsByKind: Record<DriftKind, { total: number; perSecond: number }> = {
  scale: { total: 0.04, perSecond: 0.012 },
  move: { total: 2.5, perSecond: 0.8 },
  turn: { total: 1.2, perSecond: 0.4 },
};

const stillPose: DriftPose = {
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  transform: "none",
};

export function drift(options: {
  frame: number;
  framesPerSecond: number;
  durationFrames: number;
  kind?: DriftKind;
  amount?: number;
  unit?: number;
  seed?: string;
  calm?: boolean;
}): DriftPose {
  const lastFrame = options.durationFrames - 1;
  if (options.calm === true || lastFrame <= 0) {
    return stillPose;
  }
  const kind = options.kind ?? "scale";
  const limits = limitsByKind[kind];
  const total = Math.min(
    options.amount ?? limits.total,
    (limits.perSecond * lastFrame) / options.framesPerSecond,
  );
  const remaining = 1 - Math.min(1, Math.max(0, options.frame / lastFrame));
  if (remaining === 0) {
    return stillPose;
  }
  const amount = total * remaining;
  const angle = seededRandom(options.seed ?? "drift")() * 2 * Math.PI;
  const unit = options.unit ?? 10;
  const pose = {
    x: kind === "move" ? Math.cos(angle) * amount * unit : 0,
    y: kind === "move" ? Math.sin(angle) * amount * unit : 0,
    scale: kind === "scale" ? 1 + amount : 1,
    rotate: kind === "turn" ? (angle < Math.PI ? amount : -amount) : 0,
  };
  return {
    ...pose,
    transform: `translate(${String(pose.x)}px, ${String(pose.y)}px) scale(${String(pose.scale)}) rotate(${String(pose.rotate)}deg)`,
  };
}
