export const counterExample = {
  title: "A number that counts up, with a label",
  props: { value: 1250, label: "videos made this month" },
  code: `import {
  defineReactScene,
  easings,
  tween,
  useFrame,
  useSceneContext,
} from "@yumekit/scene";
import { useStylePack } from "@yumekit/scene-kit";

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit, layout, durationFrames } = useSceneContext();
  const stylePack = useStylePack();
  const value = typeof props.value === "number" ? props.value : 0;
  const label = typeof props.label === "string" ? props.label : "";
  const settleFrame = Math.max(1, Math.min(45, Math.floor(durationFrames * 0.7)));
  const fadeFrames = Math.min(14, settleFrame);
  const shown = tween({
    frame,
    startFrame: 0,
    endFrame: settleFrame,
    from: 0,
    to: value,
    easing: easings.easeOut,
  });
  const rise = tween({ frame, startFrame: 0, endFrame: fadeFrames, from: 6 * unit, to: 0 });
  const opacity = tween({ frame, startFrame: 0, endFrame: fadeFrames, from: 0, to: 1 });
  return (
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
        background: stylePack.colors.background,
        color: stylePack.colors.text,
        fontFamily: stylePack.fonts.body.family,
        fontWeight: stylePack.fonts.body.weight,
      }}
    >
      <div
        style={{
          fontSize: (layout === "tall" ? 30 : 24) * unit,
          fontFamily: stylePack.fonts.display.family,
          fontWeight: stylePack.fonts.display.weight,
          lineHeight: 1,
          opacity,
          transform: "translateY(" + String(rise) + "px)",
        }}
      >
        {String(Math.round(shown))}
      </div>
      <div data-text-prop="label" style={{ fontSize: 6 * unit, opacity, overflowWrap: "anywhere" }}>{label}</div>
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
  code: `import {
  FrameWindow,
  defineReactScene,
  seededRandom,
  spring,
  stagger,
  useFrame,
  useSceneContext,
} from "@yumekit/scene";
import { useStylePack } from "@yumekit/scene-kit";

function Step(props: { text: string; color: string }) {
  const frame = useFrame();
  const { unit, framesPerSecond } = useSceneContext();
  const size = spring({ frame, startFrame: 0, framesPerSecond, from: 0, to: 1, damping: 14 });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 * unit, fontSize: 6 * unit }}>
      <div
        style={{
          flex: "none",
          width: 5 * unit,
          height: 5 * unit,
          borderRadius: "50%",
          background: props.color,
          transform: "scale(" + String(size) + ")",
        }}
      />
      <span style={{ overflowWrap: "anywhere" }}>{props.text}</span>
    </div>
  );
}

export default defineReactScene(({ props }) => {
  const { unit, layout, durationFrames, findAsset } = useSceneContext();
  const stylePack = useStylePack();
  const steps = Array.isArray(props.steps)
    ? props.steps.filter((step): step is string => typeof step === "string").slice(0, 5)
    : [];
  const image =
    typeof props.imageAssetId === "string" ? findAsset(props.imageAssetId) : undefined;
  const eachFrames = Math.max(
    1,
    Math.min(20, Math.floor((durationFrames * 0.7) / Math.max(1, steps.length))),
  );
  const random = seededRandom("steps-background");
  const sparks = Array.from({ length: 12 }, () => ({ left: random() * 100, top: random() * 100 }));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxSizing: "border-box",
        padding: 8 * unit,
        paddingBottom: 24 * unit,
        display: "flex",
        flexDirection: layout === "tall" ? "column" : "row",
        gap: 6 * unit,
        background: stylePack.colors.background,
        color: stylePack.colors.text,
        fontFamily: stylePack.fonts.body.family,
        fontWeight: stylePack.fonts.body.weight,
      }}
    >
      {sparks.map((spark, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: String(spark.left) + "%",
            top: String(spark.top) + "%",
            width: unit,
            height: unit,
            borderRadius: "50%",
            background: stylePack.colors.accent,
            opacity: 0.4,
          }}
        />
      ))}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 * unit }}>
        {steps.map((step, index) => (
          <FrameWindow key={index} startFrame={stagger({ index, startFrame: 0, eachFrames })}>
            <Step text={step} color={stylePack.colors.bars[index % stylePack.colors.bars.length] ?? stylePack.colors.bullet} />
          </FrameWindow>
        ))}
      </div>
      <div style={{ flex: 1, borderRadius: 2 * unit, overflow: "hidden", background: stylePack.colors.placeholder }}>
        {image === undefined ? null : (
          <img src={image.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
    </div>
  );
});
`,
} as const;

export const sceneGuideExamples = [counterExample, stepsExample] as const;
