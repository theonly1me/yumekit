import { useLayoutEffect } from "react";
import { VideoFrame, defineReactScene, easings, tween, useFrame, useHold, useSceneContext } from "@yumekit/scene";
import { enter } from "@yumekit/scene-kit/motion";

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

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit, framesPerSecond, findAsset } = useSceneContext();
  useFontFile(findAsset(textOf(props.fontAssetId, "font-geist"))?.url);
  const clips = listOf(props.clips).map((clip) => ({
    assetId: textOf(clip.assetId, ""),
    fromFrame: numberOf(clip.fromFrame, 0),
    frames: numberOf(clip.frames, 15),
    look: textOf(clip.look, ""),
  }));
  let start = 0;
  let index = 0;
  for (const [clipIndex, clip] of clips.entries()) {
    index = clipIndex;
    if (frame < start + clip.frames) break;
    start += clip.frames;
  }
  const clip = clips[index];
  const local = frame - start;
  const punch = tween({ frame: local, startFrame: 0, endFrame: 7, from: 1.07, to: 1, easing: easings.cubicBezier({ x1: 0.16, y1: 1, x2: 0.3, y2: 1 }) });
  const tagIn = enter({ frame, framesPerSecond, startFrame: 4, kind: "slide-left", unit, distanceUnits: 3, durationSeconds: 0.4 });
  const tag = textOf(props.tag, "");
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: theme.ground, fontFamily }}>
      {clip !== undefined && findAsset(clip.assetId)?.kind === "video" ? (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${String(punch)})` }}>
          <VideoFrame assetId={clip.assetId} assetFrame={clip.fromFrame + local} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          right: 4 * unit,
          bottom: 4 * unit,
          display: "flex",
          alignItems: "center",
          gap: 1.4 * unit,
          padding: `${String(1.3 * unit)}px ${String(2.4 * unit)}px`,
          borderRadius: 99 * unit,
          background: "rgb(12 12 13 / 0.82)",
          border: `1px solid ${theme.lineStrong}`,
          fontSize: 2.9 * unit,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: theme.text,
          ...tagIn,
        }}
      >
        <span data-text-prop="tag">{tag}</span>
        <span style={{ width: 1, alignSelf: "stretch", background: theme.lineStrong }} />
        <span style={{ color: theme.accent }}>{clip?.look ?? ""}</span>
      </div>
    </div>
  );
});
