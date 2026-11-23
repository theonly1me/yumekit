import { useLayoutEffect, type ReactNode } from "react";
import { defineReactScene, easings, seededRandom, tween, useFrame, useHold, useSceneContext } from "@yumekit/scene";
import { countUp, draw, enter, sequence, words } from "@yumekit/scene-kit/motion";

const theme = {
  ground: "#0c0c0d", surface: "#121213", raised: "#1a1a1c",
  line: "rgb(255 255 255 / 0.09)", lineStrong: "rgb(255 255 255 / 0.2)",
  text: "#ecebe8", muted: "#908f8b", faint: "#5e5d5a", accent: "#d9c9a8",
};
const fontFamily = "Geist, 'Helvetica Neue', Helvetica, Arial, sans-serif";

function textOf(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}
function numberOf(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function recordOf(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? { ...value } : {};
}
function listOf(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(recordOf) : [];
}
function bare(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}
function useFontFile(url: string | undefined): void {
  const hold = useHold();
  useLayoutEffect(() => {
    if (url === undefined) {
      hold.release();
      return;
    }
    const face = new FontFace("Geist", `url("${url}")`, { weight: "100 900" });
    document.fonts.add(face);
    face.load().then(hold.release, hold.release);
  }, [url, hold]);
}
function Headline(options: {
  text: string;
  accent: string;
  frame: number;
  startFrame: number;
  size: number;
  prop: string;
  kind?: "rise" | "blur" | "slide-left" | "pop" | "fade" | "scale" | "wipe";
  eachSeconds?: number;
  wordSeconds?: number;
  weight?: number;
  color?: string;
  lineHeight?: number;
}): ReactNode {
  const { framesPerSecond, unit } = useSceneContext();
  const motion = words({
    text: options.text,
    frame: options.frame,
    framesPerSecond,
    startFrame: options.startFrame,
    unit,
    kind: options.kind ?? "rise",
    distanceUnits: 4,
    eachSeconds: options.eachSeconds ?? 0.06,
    wordSeconds: options.wordSeconds ?? 0.45,
  });
  const accents = options.accent.split(/\s+/).map(bare).filter((word) => word !== "");
  return (
    <div
      data-text-prop={options.prop}
      style={{
        fontSize: options.size,
        fontWeight: options.weight ?? 600,
        letterSpacing: "-0.045em",
        lineHeight: options.lineHeight ?? 1.02,
        color: options.color ?? theme.text,
      }}
    >
      {motion.words.map((word, index) => (
        <span key={index}>
          {index === 0 ? "" : " "}
          <span style={{ display: "inline-block", color: accents.includes(bare(word.text)) ? theme.accent : "inherit", ...word.style }}>
            {word.text}
          </span>
        </span>
      ))}
    </div>
  );
}

function Wave(options: { frame: number; count: number; width: number; height: number }): ReactNode {
  const { framesPerSecond } = useSceneContext();
  const random = seededRandom("voice-wave");
  const heights = Array.from({ length: options.count }, (_, index) => 0.25 + 0.75 * Math.abs(Math.sin(index * 0.55)) * (0.45 + 0.55 * random()));
  const starts = sequence({ count: options.count, framesPerSecond, startFrame: 2, eachSeconds: 0.01 });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: options.width * 0.35, height: options.height }}>
      {heights.map((share, index) => {
        const grow = tween({ frame: options.frame, startFrame: starts[index] ?? 0, endFrame: (starts[index] ?? 0) + 8, from: 0.04, to: share, easing: easings.cubicBezier({ x1: 0.16, y1: 1, x2: 0.3, y2: 1 }) });
        return <div key={index} style={{ width: options.width, height: options.height * grow, borderRadius: options.width, background: theme.accent }} />;
      })}
    </div>
  );
}

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit, framesPerSecond, findAsset } = useSceneContext();
  useFontFile(findAsset(textOf(props.fontAssetId, "font-geist"))?.url);
  const items = listOf(props.items).map((item) => ({ text: textOf(item.text, ""), accent: textOf(item.accent, ""), frames: numberOf(item.frames, 30), visual: textOf(item.visual, "") }));
  const chips = listOf(props.chips).map((chip) => textOf(chip.text, ""));
  const looks = listOf(props.looks).map((look) => ({ ground: textOf(look.ground, "#000"), accent: textOf(look.accent, "#fff") }));
  let start = 0;
  let index = 0;
  for (const [itemIndex, item] of items.entries()) {
    index = itemIndex;
    if (frame < start + item.frames) break;
    start += item.frames;
  }
  const item = items[index];
  const local = frame - start;
  const margin = 8.9 * unit;
  const counts = numberOf(props.sceneTypes, 19);
  const lookCount = numberOf(props.lookCount, 5);
  const visual = item?.visual ?? "";
  const tiles = sequence({ count: looks.length, framesPerSecond, startFrame: 9, eachSeconds: 0.07 });
  const chipStarts = sequence({ count: chips.length, framesPerSecond, startFrame: 7, eachSeconds: 0.07 });
  const underline = draw({ frame: local, framesPerSecond, startFrame: 10, durationSeconds: 0.45 });
  const number = (options: { to: number; label: string; startFrame: number }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 * unit, ...enter({ frame: local, framesPerSecond, startFrame: options.startFrame, kind: "rise", unit, distanceUnits: 5, durationSeconds: 0.4 }) }}>
      <div style={{ fontSize: 30 * unit, fontWeight: 600, letterSpacing: "-0.06em", lineHeight: 0.9, fontVariantNumeric: "tabular-nums" }}>
        {countUp({ frame: local, framesPerSecond, to: options.to, startFrame: options.startFrame, durationSeconds: 0.55 }).text}
      </div>
      <div style={{ fontSize: 5.2 * unit, fontWeight: 500, letterSpacing: "-0.03em", color: theme.muted }}>{options.label}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: theme.ground, color: theme.text, fontFamily }}>
      <div style={{ position: "absolute", inset: 0, padding: margin, display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 * unit }}>
        {visual === "counts" ? (
          <div style={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", columnGap: 12 * unit, rowGap: 5 * unit }}>
            {number({ to: counts, label: "scene types", startFrame: -3 })}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 * unit }}>
              {number({ to: lookCount, label: "looks", startFrame: 2 })}
            </div>
            <div style={{ display: "flex", gap: 2 * unit, paddingBottom: 2.2 * unit }}>
              {looks.map((look, lookIndex) => (
                <div key={lookIndex} style={{ position: "relative", width: 15 * unit, height: 10 * unit, borderRadius: 0.9 * unit, background: look.ground, border: `1px solid ${theme.lineStrong}`, overflow: "hidden", ...enter({ frame: local, framesPerSecond, startFrame: tiles[lookIndex] ?? 0, kind: "pop", unit }) }}>
                  <div style={{ position: "absolute", right: -1.2 * unit, top: -1.2 * unit, width: 6 * unit, height: 6 * unit, borderRadius: "50%", background: look.accent }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Headline text={item?.text ?? ""} accent={item?.accent ?? ""} frame={local} startFrame={-3} size={15.5 * unit} prop={`items.${String(index)}.text`} kind="rise" eachSeconds={0.05} wordSeconds={0.38} />
        )}
        {visual === "wave" ? <Wave frame={local} count={54} width={1.7 * unit} height={20 * unit} /> : null}
        {visual === "chips" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 1.6 * unit }}>
            {chips.map((chip, chipIndex) => (
              <div key={chipIndex} style={{ padding: `${String(1.6 * unit)}px ${String(3.2 * unit)}px`, borderRadius: 99 * unit, border: `1px solid ${theme.lineStrong}`, fontSize: 4.6 * unit, fontWeight: 500, ...enter({ frame: local, framesPerSecond, startFrame: chipStarts[chipIndex] ?? 0, kind: "pop", unit }) }}>
                {chip}
              </div>
            ))}
          </div>
        ) : null}
        {visual === "local" && underline > 0.02 ? <div style={{ width: `${String(underline * 46)}%`, height: 1.1 * unit, borderRadius: unit, background: theme.accent }} /> : null}
      </div>
    </div>
  );
});
