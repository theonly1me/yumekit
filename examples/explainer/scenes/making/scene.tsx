import { useLayoutEffect } from "react";
import { defineReactScene, easings, tween, useFrame, useHold, useSceneContext } from "@yumekit/scene";
import { enter, paceFrame, typed, words } from "@yumekit/scene-kit/motion";

const theme = {
  ground: "#0c0c0d",
  surface: "#121213",
  raised: "#1a1a1c",
  line: "rgb(255 255 255 / 0.08)",
  lineStrong: "rgb(255 255 255 / 0.18)",
  text: "#ecebe8",
  muted: "#908f8b",
  faint: "#5e5d5a",
};

const fontFamily = "Geist, 'Helvetica Neue', Helvetica, Arial, sans-serif";

type Region = { x: number; y: number; width: number };
type Shot = { assetId: string; startSeconds: number };
type TypedLine = {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  startSeconds: number;
  charactersPerSecond: number;
};

function textOf(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function numberOf(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function recordOf(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? { ...value } : {};
}

function regionOf(value: unknown): Region {
  const record = recordOf(value);
  return { x: numberOf(record.x, 0), y: numberOf(record.y, 0), width: numberOf(record.width, 1440) };
}

function shotsOf(value: unknown): Shot[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = recordOf(item);
    return { assetId: textOf(record.assetId, ""), startSeconds: numberOf(record.startSeconds, 0) };
  });
}

function typedLineOf(value: unknown): TypedLine | undefined {
  const record = recordOf(value);
  if (typeof record.text !== "string") return undefined;
  return {
    text: record.text,
    x: numberOf(record.x, 0),
    y: numberOf(record.y, 0),
    width: numberOf(record.width, 600),
    fontSize: numberOf(record.fontSize, 26),
    lineHeight: numberOf(record.lineHeight, 35),
    letterSpacing: numberOf(record.letterSpacing, 0),
    startSeconds: numberOf(record.startSeconds, 0.5),
    charactersPerSecond: numberOf(record.charactersPerSecond, 40),
  };
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

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit, framesPerSecond, durationFrames, findAsset, output } = useSceneContext();
  useFontFile(findAsset(textOf(props.fontAssetId, "font-geist"))?.url);
  const heading = textOf(props.heading, "");
  const label = textOf(props.label, "");
  const screenWidth = numberOf(props.screenWidth, 1440);
  const screenHeight = numberOf(props.screenHeight, 900);
  const cameraFrom = regionOf(props.cameraFrom);
  const cameraTo = regionOf(props.cameraTo);
  const shots = shotsOf(props.shots);
  const typedLine = typedLineOf(props.typed);
  const windowEnters = props.windowEnters !== false;

  const headingAt = (motionFrame: number) =>
    words({ text: heading, frame: motionFrame, framesPerSecond, startFrame: 0.05 * framesPerSecond, unit, eachSeconds: 0.07 });
  const windowStart = 0.2 * framesPerSecond;
  const settleFrame = Math.max(headingAt(0).settleFrame, windowStart + 0.7 * framesPerSecond);
  const motionFrame = paceFrame({ frame, durationFrames, settleFrame });
  const headingWords = headingAt(motionFrame).words;
  const windowMotion = enter({ frame: motionFrame, framesPerSecond, startFrame: windowStart, kind: "rise", unit, distanceUnits: 4, durationSeconds: 0.8 });
  const windowIn = windowEnters ? windowMotion : {};

  const margin = 9 * unit;
  const headingSize = 9 * unit;
  const windowTop = margin + headingSize * 1.05 + 5.5 * unit;
  const barHeight = 3.6 * unit;
  const viewportWidth = output.widthPixels - 2 * margin;
  const viewportHeight = output.heightPixels - windowTop - margin - barHeight;

  const moveEnd = Math.max(1, Math.round(durationFrames * 0.9));
  const along = (from: number, to: number) =>
    tween({ frame, startFrame: 0, endFrame: moveEnd, from, to, easing: easings.cubicBezier({ x1: 0.4, y1: 0, x2: 0.2, y2: 1 }) });
  const regionWidth = along(cameraFrom.width, cameraTo.width);
  const scale = viewportWidth / regionWidth;
  const left = along(cameraFrom.x, cameraTo.x);
  const top = along(cameraFrom.y, cameraTo.y);

  const typedState =
    typedLine === undefined
      ? undefined
      : typed({ text: typedLine.text, frame, framesPerSecond, startFrame: typedLine.startSeconds * framesPerSecond, charactersPerSecond: typedLine.charactersPerSecond });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: theme.ground, color: theme.text, fontFamily }}>
      <h1
        data-text-prop="heading"
        style={{
          position: "absolute",
          left: margin,
          top: margin,
          margin: 0,
          fontSize: headingSize,
          fontWeight: 500,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          whiteSpace: "nowrap",
        }}
      >
        {headingWords.map((word, index) => (
          <span key={index}>
            {index === 0 ? "" : " "}
            <span style={{ display: "inline-block", ...word.style }}>{word.text}</span>
          </span>
        ))}
      </h1>
      <div
        style={{
          position: "absolute",
          left: margin,
          top: windowTop,
          width: viewportWidth,
          height: viewportHeight + barHeight,
          borderRadius: 1.1 * unit,
          border: `1px solid ${theme.lineStrong}`,
          background: theme.surface,
          overflow: "hidden",
          boxSizing: "border-box",
          ...windowIn,
        }}
      >
        <div
          style={{
            height: barHeight,
            boxSizing: "border-box",
            borderBottom: `1px solid ${theme.line}`,
            display: "flex",
            alignItems: "center",
            paddingLeft: 2 * unit,
            gap: 1.6 * unit,
            fontSize: 1.5 * unit,
            fontWeight: 500,
            color: theme.faint,
          }}
        >
          <span style={{ color: theme.muted }}>yumekit</span>
          <span data-text-prop="label">{label}</span>
        </div>
        <div style={{ position: "relative", width: viewportWidth - 2, height: viewportHeight - 1, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: screenWidth,
              height: screenHeight,
              transformOrigin: "0 0",
              transform: `scale(${String(scale)}) translate(${String(-left)}px, ${String(-top)}px)`,
            }}
          >
            {shots.map((shot, index) => {
              const asset = findAsset(shot.assetId);
              const startFrame = shot.startSeconds * framesPerSecond;
              const opacity = index === 0 ? 1 : tween({ frame, startFrame, endFrame: startFrame + 0.2 * framesPerSecond, from: 0, to: 1 });
              return asset === undefined || opacity <= 0 ? null : (
                <img key={shot.assetId} src={asset.url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity }} />
              );
            })}
            {typedLine === undefined || typedState === undefined ? null : (
              <div
                style={{
                  position: "absolute",
                  left: typedLine.x,
                  top: typedLine.y,
                  width: typedLine.width,
                  fontSize: typedLine.fontSize,
                  lineHeight: `${String(typedLine.lineHeight)}px`,
                  letterSpacing: typedLine.letterSpacing,
                  fontWeight: 400,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                  color: theme.text,
                  opacity: frame >= (shots.at(-1)?.startSeconds ?? Infinity) * framesPerSecond + 0.2 * framesPerSecond ? 0 : 1,
                }}
              >
                {typedState.shown}
                {typedState.cursorVisible && !typedState.done ? (
                  <span style={{ display: "inline-block", width: 2, height: typedLine.fontSize * 1.05, marginLeft: 1, verticalAlign: "-0.18em", background: theme.text }} />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
