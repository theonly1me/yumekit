import { useLayoutEffect } from "react";
import { defineReactScene, useFrame, useHold, useSceneContext } from "@yumekit/scene";
import { drift, enter, paceFrame, sequence, typed } from "@yumekit/scene-kit/motion";

const theme = {
  ground: "#0c0c0d",
  lineStrong: "rgb(255 255 255 / 0.18)",
  text: "#ecebe8",
  muted: "#908f8b",
  accent: "#d9c9a8",
};

const fontFamily = "Geist, 'Helvetica Neue', Helvetica, Arial, sans-serif";

function textOf(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
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
  const { unit, framesPerSecond, durationFrames, findAsset } = useSceneContext();
  useFontFile(findAsset(textOf(props.fontAssetId, "font-geist"))?.url);
  const name = textOf(props.name, "yumekit");
  const line = textOf(props.line, "");
  const command = textOf(props.command, "");

  const [nameStart = 0, lineStart = 0, pillStart = 0] = sequence({ count: 3, framesPerSecond, startFrame: 0.05 * framesPerSecond, eachSeconds: 0.3, itemSeconds: 0.7 });
  const typeStart = pillStart + 0.25 * framesPerSecond;
  const charactersPerSecond = 40;
  const settleFrame = Math.max(pillStart + 0.7 * framesPerSecond, typeStart + (command.length / charactersPerSecond) * framesPerSecond);
  const motionFrame = paceFrame({ frame, durationFrames, settleFrame });
  const commandState = typed({ text: command, frame: motionFrame, framesPerSecond, startFrame: typeStart, charactersPerSecond });
  const cursorOn = Math.floor(frame / (0.5 * framesPerSecond)) % 2 === 0 || !commandState.done;
  const float = drift({ frame, framesPerSecond, durationFrames, kind: "scale", amount: 0.6 });
  const margin = 9 * unit;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: theme.ground, color: theme.text, fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: margin,
          right: margin,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 4.5 * unit,
          transform: float.transform,
          transformOrigin: "left center",
        }}
      >
        <div style={enter({ frame: motionFrame, framesPerSecond, startFrame: nameStart, kind: "rise", unit, distanceUnits: 4, durationSeconds: 0.8 })}>
          <div data-text-prop="name" style={{ fontSize: 21 * unit, fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 0.95 }}>
            {name}
          </div>
        </div>
        <div style={enter({ frame: motionFrame, framesPerSecond, startFrame: lineStart, kind: "rise", unit, distanceUnits: 3 })}>
          <div data-text-prop="line" style={{ fontSize: 4.6 * unit, fontWeight: 400, letterSpacing: "-0.015em", color: theme.muted, lineHeight: 1.25, maxWidth: 150 * unit }}>
            {line}
          </div>
        </div>
        <div style={{ display: "flex", ...enter({ frame: motionFrame, framesPerSecond, startFrame: pillStart, kind: "rise", unit, distanceUnits: 3 }) }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2 * unit,
              border: `1px solid ${theme.lineStrong}`,
              borderRadius: 999,
              padding: `${String(2.2 * unit)}px ${String(3.6 * unit)}px`,
              fontSize: 4.2 * unit,
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            <span style={{ color: theme.muted }}>$</span>
            <span style={{ position: "relative" }}>
              <span style={{ visibility: "hidden" }}>{command}</span>
              <span data-text-prop="command" style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}>
                {commandState.shown}
                <span
                  style={{
                    display: "inline-block",
                    width: 0.45 * unit,
                    height: 4.6 * unit,
                    marginLeft: 0.5 * unit,
                    verticalAlign: "-0.22em",
                    background: theme.accent,
                    opacity: cursorOn ? 1 : 0,
                  }}
                />
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
