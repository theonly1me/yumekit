import { useLayoutEffect } from "react";
import { defineReactScene, useFrame, useHold, useSceneContext } from "@yumekit/scene";
import { drift, enter, paceFrame, sequence, words } from "@yumekit/scene-kit/motion";

const theme = {
  ground: "#0c0c0d",
  surface: "#121213",
  lineStrong: "rgb(255 255 255 / 0.18)",
  text: "#ecebe8",
  muted: "#908f8b",
  faint: "#5e5d5a",
};

const fontFamily = "Geist, 'Helvetica Neue', Helvetica, Arial, sans-serif";

type Shape = { assetId: string; name: string; ratio: string; aspect: number };

function textOf(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function shapesOf(value: unknown): Shape[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 4).map((item) => {
    const record: Record<string, unknown> = typeof item === "object" && item !== null && !Array.isArray(item) ? { ...item } : {};
    const aspect = typeof record.aspect === "number" && record.aspect > 0 ? record.aspect : 1;
    return { assetId: textOf(record.assetId, ""), name: textOf(record.name, ""), ratio: textOf(record.ratio, ""), aspect };
  });
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
  const shapes = shapesOf(props.shapes);

  const headingAt = (motionFrame: number) =>
    words({ text: heading, frame: motionFrame, framesPerSecond, startFrame: 0.05 * framesPerSecond, unit, eachSeconds: 0.07 });
  const starts = sequence({ count: shapes.length, framesPerSecond, startFrame: 0.25 * framesPerSecond, eachSeconds: 0.18, itemSeconds: 0.7 });
  const settleFrame = Math.max(headingAt(0).settleFrame, (starts.at(-1) ?? 0) + 0.7 * framesPerSecond);
  const motionFrame = paceFrame({ frame, durationFrames, settleFrame });
  const headingWords = headingAt(motionFrame).words;
  const float = drift({ frame, framesPerSecond, durationFrames, kind: "scale", amount: 0.5 });

  const margin = 9 * unit;
  const headingSize = 9 * unit;
  const contentTop = margin + headingSize * 1.05 + 5.5 * unit;
  const gap = 3.2 * unit;
  const labelHeight = 6 * unit;
  const contentWidth = output.widthPixels - 2 * margin;
  const contentHeight = output.heightPixels - contentTop - margin;
  const aspectSum = shapes.reduce((sum, shape) => sum + shape.aspect, 0);
  const byWidth = (contentWidth - gap * Math.max(0, shapes.length - 1)) / Math.max(aspectSum, 0.1);
  const pictureHeight = Math.min(byWidth, contentHeight - labelHeight);
  const rowTop = contentTop + Math.max(0, (contentHeight - pictureHeight - labelHeight) / 2);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: theme.ground, color: theme.text, fontFamily }}>
      <h1
        data-text-prop="heading"
        style={{ position: "absolute", left: margin, top: margin, margin: 0, fontSize: headingSize, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.05, whiteSpace: "nowrap" }}
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
          top: rowTop,
          display: "flex",
          alignItems: "flex-start",
          gap,
          transform: float.transform,
          transformOrigin: "left top",
        }}
      >
        {shapes.map((shape, index) => {
          const asset = findAsset(shape.assetId);
          const startFrame = starts[index] ?? 0;
          return (
            <div key={index} style={{ ...enter({ frame: motionFrame, framesPerSecond, startFrame, kind: "rise", unit, distanceUnits: 4, durationSeconds: 0.7 }) }}>
              <div
                style={{
                  width: pictureHeight * shape.aspect,
                  height: pictureHeight,
                  borderRadius: 0.8 * unit,
                  border: `1px solid ${theme.lineStrong}`,
                  overflow: "hidden",
                  background: theme.surface,
                  boxSizing: "border-box",
                }}
              >
                {asset === undefined ? null : <img src={asset.url} style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />}
              </div>
              <div style={{ marginTop: 1.8 * unit, fontSize: 3 * unit, fontWeight: 500, display: "flex", gap: 1 * unit, whiteSpace: "nowrap" }}>
                <span data-text-prop={`shapes.${String(index)}.name`}>{shape.name}</span>
                <span style={{ color: theme.faint }}>{shape.ratio}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
