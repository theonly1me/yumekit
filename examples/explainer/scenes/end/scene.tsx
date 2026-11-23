import { useLayoutEffect } from "react";
import { defineReactScene, useFrame, useHold, useSceneContext } from "@yumekit/scene";
import { drift, enter, pulse, typed } from "@yumekit/scene-kit/motion";

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
  const { unit, framesPerSecond, findAsset } = useSceneContext();
  useFontFile(findAsset(textOf(props.fontAssetId, "font-geist"))?.url);
  const name = textOf(props.name, "yumekit");
  const line = textOf(props.line, "");
  const command = textOf(props.command, "");
  const typeStart = numberOf(props.typeStart, 16);
  const typedState = typed({ text: command, frame, framesPerSecond, startFrame: typeStart, charactersPerSecond: 34 });
  const margin = 8.9 * unit;
  const nameIn = enter({ frame, framesPerSecond, startFrame: -5, kind: "wipe", unit, durationSeconds: 0.5 });
  const float = drift({ frame, framesPerSecond, durationFrames: numberOf(props.durationFrames, 90), kind: "scale", amount: 0.5 });
  const lineIn = enter({ frame, framesPerSecond, startFrame: 3, kind: "rise", unit, distanceUnits: 3, durationSeconds: 0.45 });
  const pillIn = enter({ frame, framesPerSecond, startFrame: 7, kind: "rise", unit, distanceUnits: 3, durationSeconds: 0.45 });
  const settle = pulse({ frame, framesPerSecond, atFrame: typeStart + Math.ceil((command.length / 34) * framesPerSecond) + 2, amount: 0.035 });
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: theme.ground, color: theme.text, fontFamily }}>
      <div style={{ position: "absolute", inset: 0, padding: margin, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4.5 * unit, transform: float.transform, transformOrigin: "left center" }}>
        <div data-text-prop="name" style={{ fontSize: 31 * unit, fontWeight: 600, letterSpacing: "-0.065em", lineHeight: 0.92, marginLeft: -1.2 * unit, ...nameIn }}>
          {name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 * unit }}>
          <div data-text-prop="line" style={{ fontSize: 7.6 * unit, fontWeight: 500, letterSpacing: "-0.035em", ...lineIn }}>
            {line}
          </div>
          <div style={pillIn}>
            <div style={{ display: "flex", alignItems: "center", gap: 1.6 * unit, padding: `${String(1.6 * unit)}px ${String(3 * unit)}px`, borderRadius: 99 * unit, border: `1px solid ${theme.lineStrong}`, background: theme.raised, fontSize: 4.9 * unit, fontWeight: 500, letterSpacing: "-0.01em", transform: `scale(${String(settle)})`, transformOrigin: "left center" }}>
              <span style={{ color: theme.accent }}>$</span>
              <span data-text-prop="command" style={{ whiteSpace: "pre" }}>{typedState.shown}</span>
              <span style={{ display: "inline-block", width: 0.35 * unit, height: 5.3 * unit, background: theme.text, opacity: typedState.done ? 0 : 1, marginLeft: -0.8 * unit }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
