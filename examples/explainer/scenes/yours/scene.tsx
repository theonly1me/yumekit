import { useLayoutEffect, type ReactNode } from "react";
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

type Segment = { assetId: string; frames: number; from: number; to: number };
type Shot = { frame: number; x: number; y: number; width: number };

function assetFrameAt(options: { frame: number; segments: Segment[]; framesPerSecond: number }): { assetId: string; assetFrame: number } {
  let start = 0;
  for (const segment of options.segments) {
    if (options.frame < start + segment.frames || segment === options.segments.at(-1)) {
      const share = Math.min(1, (options.frame - start) / Math.max(1, segment.frames));
      return { assetId: segment.assetId, assetFrame: (segment.from + (segment.to - segment.from) * share) * options.framesPerSecond };
    }
    start += segment.frames;
  }
  return { assetId: "", assetFrame: 0 };
}

function cameraAt(options: { frame: number; shots: Shot[] }): Shot {
  const [first] = options.shots;
  if (first === undefined) return { frame: 0, x: 0, y: 0, width: 1440 };
  let current = first;
  for (const next of options.shots.slice(1)) {
    if (options.frame < next.frame) {
      const along = (from: number, to: number) =>
        tween({ frame: options.frame, startFrame: current.frame, endFrame: next.frame, from, to, easing: easings.cubicBezier({ x1: 0.65, y1: 0, x2: 0.35, y2: 1 }) });
      return { frame: options.frame, x: along(current.x, next.x), y: along(current.y, next.y), width: along(current.width, next.width) };
    }
    current = next;
  }
  return current;
}

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit, output, framesPerSecond, findAsset } = useSceneContext();
  useFontFile(findAsset(textOf(props.fontAssetId, "font-geist"))?.url);
  const defaultAssetId = textOf(props.assetId, "");
  const side = props.layout === "side";
  const heading = textOf(props.heading, "");
  const subheading = textOf(props.subheading, "");
  const label = textOf(props.label, "");
  const segments = listOf(props.segments).map((item) => ({ assetId: textOf(item.assetId, defaultAssetId), frames: numberOf(item.frames, 30), from: numberOf(item.from, 0), to: numberOf(item.to, 1) }));
  const shots = listOf(props.camera).map((item) => ({ frame: numberOf(item.frame, 0), x: numberOf(item.x, 0), y: numberOf(item.y, 0), width: numberOf(item.width, 1440) }));
  const windowEnters = props.windowEnters === true;
  const headingStart = numberOf(props.headingStart, -3);
  const margin = 8.9 * unit;
  const headingSize = (side ? 10.5 : 9.2) * unit;
  const windowLeft = side ? 0.43 * output.widthPixels : margin;
  const windowTop = side ? 9 * unit : margin + headingSize * 1.1 + 4.5 * unit;
  const windowWidth = side ? output.widthPixels - windowLeft + 4 * unit : output.widthPixels - 2 * margin;
  const windowHeight = side ? output.heightPixels - 2 * windowTop : output.heightPixels - windowTop + 4 * unit;
  const barHeight = 4 * unit;
  const camera = cameraAt({ frame, shots });
  const scale = windowWidth / camera.width;
  const shown = assetFrameAt({ frame, segments, framesPerSecond });
  const asset = findAsset(shown.assetId);
  const windowIn = windowEnters ? enter({ frame, framesPerSecond, kind: "rise", unit, distanceUnits: 10, durationSeconds: 0.5 }) : {};
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: theme.ground, color: theme.text, fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: windowLeft,
          top: windowTop,
          width: windowWidth,
          height: windowHeight,
          borderRadius: 1.4 * unit,
          border: `1px solid ${theme.lineStrong}`,
          background: theme.surface,
          overflow: "hidden",
          boxSizing: "border-box",
          boxShadow: "0 40px 120px rgb(0 0 0 / 0.55)",
          ...windowIn,
        }}
      >
        <div style={{ height: barHeight, boxSizing: "border-box", borderBottom: `1px solid ${theme.line}`, display: "flex", alignItems: "center", gap: 1.6 * unit, paddingLeft: 2.2 * unit, fontSize: 1.6 * unit, fontWeight: 500, color: theme.faint }}>
          <span style={{ color: theme.muted }}>yumekit</span>
          <span data-text-prop="label">{label}</span>
        </div>
        <div style={{ position: "relative", width: "100%", height: windowHeight - barHeight, overflow: "hidden", background: "#111111" }}>
          {asset?.kind === "video" ? (
            <div style={{ position: "absolute", left: 0, top: 0, width: 1440 * scale, height: 900 * scale, transform: `translate(${String(-camera.x * scale)}px, ${String(-camera.y * scale)}px)` }}>
              <VideoFrame assetId={shown.assetId} assetFrame={shown.assetFrame} />
            </div>
          ) : null}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: margin,
          top: side ? 0 : margin - 1.2 * unit,
          bottom: side ? 0 : undefined,
          width: side ? windowLeft - margin - 5 * unit : output.widthPixels - 2 * margin,
          display: "flex",
          flexDirection: "column",
          justifyContent: side ? "center" : "flex-start",
          gap: 3 * unit,
        }}
      >
        <Headline text={heading} accent={textOf(props.accentWord, "")} frame={frame} startFrame={headingStart} size={headingSize} prop="heading" />
        {subheading === "" ? null : (
          <div
            data-text-prop="subheading"
            style={{ fontSize: 3.6 * unit, lineHeight: 1.3, fontWeight: 500, letterSpacing: "-0.015em", color: theme.muted, ...enter({ frame, framesPerSecond, startFrame: headingStart + 9, kind: "rise", unit, distanceUnits: 2, durationSeconds: 0.45 }) }}
          >
            {subheading}
          </div>
        )}
      </div>
    </div>
  );
});
