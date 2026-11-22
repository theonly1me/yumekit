import { seededRandom } from "@yumekit/scene";

export interface GlowPath {
  homeXPercent: number;
  homeYPercent: number;
  periodXSeconds: number;
  periodYSeconds: number;
  phase: number;
}

const pathPercent = 16;
const homeSpreadPercent = 20;
const shortestPeriodSeconds = 11;
const periodSpreadSeconds = 6;

export function glowPathsOf(seed: string): [GlowPath, GlowPath] {
  const random = seededRandom(seed);
  const pathAt = (home: { xPercent: number; yPercent: number }): GlowPath => ({
    homeXPercent: home.xPercent + (random() - 0.5) * homeSpreadPercent,
    homeYPercent: home.yPercent + (random() - 0.5) * homeSpreadPercent,
    periodXSeconds: shortestPeriodSeconds + random() * periodSpreadSeconds,
    periodYSeconds: shortestPeriodSeconds + random() * periodSpreadSeconds,
    phase: random() * 2 * Math.PI,
  });
  return [
    pathAt({ xPercent: 22, yPercent: 30 }),
    pathAt({ xPercent: 80, yPercent: 72 }),
  ];
}

export function glowCenterOf(options: { path: GlowPath; seconds: number }): {
  xPercent: number;
  yPercent: number;
} {
  const { path, seconds } = options;
  const turn = 2 * Math.PI * seconds;
  return {
    xPercent:
      path.homeXPercent +
      pathPercent * Math.sin(turn / path.periodXSeconds + path.phase),
    yPercent:
      path.homeYPercent +
      pathPercent * Math.cos(turn / path.periodYSeconds + path.phase),
  };
}
