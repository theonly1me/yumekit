import { useLayoutEffect, type ReactNode } from "react";
import { VideoFrame, defineReactScene, useFrame, useHold, useSceneContext } from "@yumekit/scene";
import { drift, enter, sequence, words } from "@yumekit/scene-kit/motion";

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

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit, output, framesPerSecond, findAsset } = useSceneContext();
  useFontFile(findAsset(textOf(props.fontAssetId, "font-geist"))?.url);
  const items = listOf(props.items).map((item) => ({
    assetId: textOf(item.assetId, ""),
    name: textOf(item.name, ""),
    shape: textOf(item.shape, ""),
    ratio: numberOf(item.ratio, 1),
  }));
  const fromFrame = numberOf(props.fromFrame, 0);
  const margin = 6 * unit;
  const gap = 2.4 * unit;
  const headingSize = 9.2 * unit;
  const top = 7.7 * unit + headingSize * 1.1 + 3 * unit;
  const available = output.widthPixels - 2 * margin - gap * Math.max(0, items.length - 1);
  const ratioSum = items.reduce((sum, item) => sum + item.ratio, 0);
  const height = Math.min(available / Math.max(0.1, ratioSum), output.heightPixels - top - 9 * unit);
  const rowTop = top + Math.max(0, (output.heightPixels - margin - top - height - 5 * unit) / 2);
  const starts = sequence({ count: items.length, framesPerSecond, startFrame: -3, eachSeconds: 0.2 });
  const float = drift({ frame, framesPerSecond, durationFrames: 90, kind: "move", unit, amount: 0.6, seed: "shapes" });
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: theme.ground, color: theme.text, fontFamily }}>
      <div style={{ position: "absolute", left: 8.9 * unit, top: 7.7 * unit }}>
        <Headline text={textOf(props.heading, "")} accent={textOf(props.accentWord, "")} frame={frame} startFrame={-3} size={headingSize} prop="heading" />
      </div>
      <div style={{ position: "absolute", left: margin, top: rowTop, display: "flex", alignItems: "flex-end", gap, transform: float.transform }}>
        {items.map((item, index) => {
          const startFrame = starts[index] ?? 0;
          const asset = findAsset(item.assetId);
          return (
            <div key={index} style={{ display: "flex", flexDirection: "column", gap: 1.6 * unit, ...enter({ frame, framesPerSecond, startFrame, kind: "rise", unit, distanceUnits: 8, durationSeconds: 0.5 }) }}>
              <div style={{ width: height * item.ratio, height, borderRadius: 1.2 * unit, overflow: "hidden", border: `1px solid ${theme.lineStrong}`, background: theme.surface }}>
                {asset?.kind === "video" ? <VideoFrame assetId={item.assetId} assetFrame={fromFrame + frame} /> : null}
              </div>
              <div style={{ display: "flex", gap: 1.2 * unit, fontSize: 2.3 * unit, fontWeight: 500, ...enter({ frame, framesPerSecond, startFrame: startFrame + 5, kind: "fade", unit }) }}>
                <span data-text-prop={`items.${String(index)}.name`}>{item.name}</span>
                <span style={{ color: theme.muted }}>{item.shape}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
