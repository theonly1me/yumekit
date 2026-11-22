import { motionExample } from "./motionExample.js";

export const counterExample = {
  title: "A number that counts up, with a label",
  props: { value: 1250, label: "videos made this month" },
  code: `import { defineReactScene, useFrame, useSceneContext } from "@yumekit/scene";
import { Backdrop, useStylePack } from "@yumekit/scene-kit";
import { countUp, drift, enter, paceFrame, pulse } from "@yumekit/scene-kit/motion";

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit, layout, framesPerSecond, durationFrames } = useSceneContext();
  const stylePack = useStylePack();
  const tall = layout === "tall";
  const value = typeof props.value === "number" ? props.value : 0;
  const label = typeof props.label === "string" ? props.label : "";
  const countSeconds = 1.2;
  const countEnd = countSeconds * framesPerSecond;
  const settleFrame = countEnd + 0.4 * framesPerSecond;
  const motionFrame = paceFrame({ frame, durationFrames, settleFrame });
  const count = countUp({ frame: motionFrame, framesPerSecond, to: value, durationSeconds: countSeconds });
  const numberIn = enter({ frame: motionFrame, framesPerSecond, kind: "scale", unit });
  const labelIn = enter({ frame: motionFrame, framesPerSecond, startFrame: 0.5 * framesPerSecond, unit });
  const beat = pulse({ frame: motionFrame, framesPerSecond, atFrame: countEnd });
  const float = drift({ frame, framesPerSecond, durationFrames, kind: "move", unit, seed: "videos-made" });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        color: stylePack.colors.text,
        fontFamily: stylePack.fonts.body.family,
        fontWeight: stylePack.fonts.body.weight,
      }}
    >
      <Backdrop seed="videos-made" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          padding: 8 * unit,
          paddingBottom: 24 * unit,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2 * unit,
          transform: float.transform,
        }}
      >
        <div style={numberIn}>
          <div
            style={{
              fontSize: (tall ? 26 : 24) * unit,
              fontFamily: stylePack.fonts.display.family,
              fontWeight: stylePack.fonts.display.weight,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              color: stylePack.colors.accent,
              transform: "scale(" + String(beat) + ")",
              transformOrigin: "left center",
            }}
          >
            {count.text}
          </div>
        </div>
        <div data-text-prop="label" style={{ fontSize: (tall ? 7.5 : 6) * unit, overflowWrap: "anywhere", ...labelIn }}>
          {label}
        </div>
      </div>
    </div>
  );
});
`,
} as const;

export const stepsExample = {
  title: "Steps that pop in one after another, next to an image",
  props: {
    steps: ["Write the script", "Make the voice", "Render the video"],
    imageAssetId: "hero",
  },
  code: `import { defineReactScene, useFrame, useSceneContext } from "@yumekit/scene";
import { Backdrop, useStylePack } from "@yumekit/scene-kit";
import { drift, enter, paceFrame, sequence } from "@yumekit/scene-kit/motion";

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit, layout, framesPerSecond, durationFrames, findAsset } = useSceneContext();
  const stylePack = useStylePack();
  const tall = layout === "tall";
  const steps = Array.isArray(props.steps)
    ? props.steps.filter((step): step is string => typeof step === "string").slice(0, 5)
    : [];
  const image = typeof props.imageAssetId === "string" ? findAsset(props.imageAssetId) : undefined;
  const starts = sequence({ count: steps.length, framesPerSecond, startFrame: 0.3 * framesPerSecond, eachSeconds: 0.35 });
  const settleFrame = (starts.at(-1) ?? 0) + 0.7 * framesPerSecond;
  const motionFrame = paceFrame({ frame, durationFrames, settleFrame });
  const imageIn = enter({ frame: motionFrame, framesPerSecond, kind: "scale", unit });
  const imageDrift = drift({ frame, framesPerSecond, durationFrames, kind: "scale" });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        color: stylePack.colors.text,
        fontFamily: stylePack.fonts.body.family,
        fontWeight: stylePack.fonts.body.weight,
      }}
    >
      <Backdrop seed="three-steps" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          padding: 8 * unit,
          paddingBottom: 24 * unit,
          display: "flex",
          flexDirection: tall ? "column" : "row",
          gap: 6 * unit,
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 * unit }}>
          {steps.map((step, index) => {
            const startFrame = starts[index] ?? 0;
            return (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: 3 * unit, fontSize: (tall ? 7.5 : 6) * unit }}>
                <div
                  style={{
                    flex: "none",
                    width: 5 * unit,
                    height: 5 * unit,
                    borderRadius: "50%",
                    background: stylePack.colors.accent,
                    ...enter({ frame: motionFrame, framesPerSecond, startFrame, kind: "pop", unit }),
                  }}
                />
                <div
                  data-text-prop={"steps." + String(index)}
                  style={{
                    overflowWrap: "anywhere",
                    ...enter({ frame: motionFrame, framesPerSecond, startFrame: startFrame + 0.1 * framesPerSecond, kind: "slide-left", unit }),
                  }}
                >
                  {step}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, borderRadius: stylePack.cornerUnits * unit, overflow: "hidden", background: stylePack.colors.surface, ...imageIn }}>
          {image === undefined ? null : (
            <img src={image.url} style={{ width: "100%", height: "100%", objectFit: "cover", transform: imageDrift.transform }} />
          )}
        </div>
      </div>
    </div>
  );
});
`,
} as const;

export const sceneGuideExamples = [
  motionExample,
  counterExample,
  stepsExample,
] as const;
