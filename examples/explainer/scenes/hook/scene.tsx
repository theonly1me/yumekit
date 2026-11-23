import { useLayoutEffect } from "react";
import { VideoFrame, defineReactScene, easings, tween, useFrame, useHold, useSceneContext } from "@yumekit/scene";
import { enter, words } from "@yumekit/scene-kit/motion";

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

function lineSize(options: { text: string; width: number; height: number }): number {
  return Math.min(0.3 * options.height, (0.86 * options.width) / Math.max(4, options.text.length * 0.5));
}

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit, output, framesPerSecond, findAsset } = useSceneContext();
  useFontFile(findAsset(textOf(props.fontAssetId, "font-geist"))?.url);
  const lines = listOf(props.lines).map((line) => ({ text: textOf(line.text, ""), startFrame: numberOf(line.startFrame, 0) }));
  const wall = listOf(props.wall).map((tile) => ({ assetId: textOf(tile.assetId, ""), fromFrame: numberOf(tile.fromFrame, 0) }));
  const wallStart = numberOf(props.wallStart, 68);
  const columns = Math.max(1, numberOf(props.columns, 4));
  const activeIndex = lines.reduce((found, line, index) => (frame >= line.startFrame ? index : found), 0);
  const active = lines[activeIndex];
  const local = frame - (active?.startFrame ?? 0);
  const text = active?.text ?? "";
  const size = lineSize({ text, width: output.widthPixels, height: output.heightPixels });
  const motion = words({ text, frame: local, framesPerSecond, startFrame: -4, unit, kind: "rise", distanceUnits: 9, eachSeconds: 0.06, wordSeconds: 0.36 });
  const isLast = activeIndex === lines.length - 1;
  const gap = 1.1 * unit;
  const tileWidth = (output.widthPixels - gap * (columns + 1)) / columns;
  const tileHeight = tileWidth * (output.heightPixels / output.widthPixels);
  const rows = Math.ceil(wall.length / columns);
  const wallTop = (output.heightPixels - (rows * tileHeight + (rows - 1) * gap)) / 2;
  const center = { x: (columns - 1) / 2, y: (rows - 1) / 2 };
  const order = wall.map((_, index) => Math.hypot((index % columns) - center.x, Math.floor(index / columns) - center.y));
  const pull = tween({ frame, startFrame: wallStart, endFrame: wallStart + 22, from: 1.35, to: 1.04, easing: easings.cubicBezier({ x1: 0.16, y1: 1, x2: 0.3, y2: 1 }) });
  const scrim = tween({ frame, startFrame: wallStart, endFrame: wallStart + 8, from: 0, to: 1 });
  const lift = isLast ? tween({ frame, startFrame: wallStart, endFrame: wallStart + 10, from: 1, to: 0.86, easing: easings.cubicBezier({ x1: 0.16, y1: 1, x2: 0.3, y2: 1 }) }) : 1;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: theme.ground, color: theme.text, fontFamily }}>
      {isLast && frame >= wallStart ? (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${String(pull)})` }}>
          {wall.map((tile, index) => {
            const startFrame = wallStart + (order[index] ?? 0) * 2.2;
            const tileIn = enter({ frame, framesPerSecond, startFrame, kind: "scale", unit, durationSeconds: 0.35 });
            const asset = findAsset(tile.assetId);
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: gap + (index % columns) * (tileWidth + gap),
                  top: wallTop + Math.floor(index / columns) * (tileHeight + gap),
                  width: tileWidth,
                  height: tileHeight,
                  borderRadius: 0.8 * unit,
                  overflow: "hidden",
                  background: theme.surface,
                  ...tileIn,
                }}
              >
                {asset?.kind === "video" ? <VideoFrame assetId={tile.assetId} assetFrame={tile.fromFrame + frame - wallStart} /> : null}
              </div>
            );
          })}
        </div>
      ) : null}
      <div style={{ position: "absolute", inset: 0, opacity: scrim, background: "radial-gradient(ellipse 62% 48% at 50% 50%, rgb(12 12 13 / 0.92), rgb(12 12 13 / 0.55) 70%, rgb(12 12 13 / 0.25))" }} />
      <div
        data-text-prop={`lines.${String(activeIndex)}.text`}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          transform: `translateY(-54%) scale(${String(lift)})`,
          textAlign: "center",
          whiteSpace: "nowrap",
          fontSize: size,
          fontWeight: 600,
          letterSpacing: "-0.055em",
          lineHeight: 1,
          textShadow: isLast ? "0 0.04em 0.3em rgb(0 0 0 / 0.6)" : "none",
        }}
      >
        {motion.words.map((word, index) => (
          <span key={index}>
            {index === 0 ? "" : " "}
            <span style={{ display: "inline-block", color: isLast && index === motion.words.length - 1 ? theme.accent : theme.text, ...word.style }}>{word.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
});
