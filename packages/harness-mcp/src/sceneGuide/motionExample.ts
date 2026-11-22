export const motionExample = {
  title:
    "A headline that comes in word by word, a line drawn under one word, and points that build",
  props: {
    heading: "Your idea becomes a video tonight",
    accentWord: "video",
    points: ["Write one line", "Pick a look", "Share it anywhere"],
  },
  code: `import { defineReactScene, useFrame, useSceneContext } from "@yumekit/scene";
import { Backdrop, useStylePack } from "@yumekit/scene-kit";
import { draw, drift, enter, paceFrame, sequence, words } from "@yumekit/scene-kit/motion";

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function bareWord(word: string): string {
  return word.toLowerCase().replace(/[^\\p{L}\\p{N}]/gu, "");
}

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const { unit, layout, framesPerSecond, durationFrames } = useSceneContext();
  const stylePack = useStylePack();
  const tall = layout === "tall";
  const heading = textOf(props.heading);
  const accentWord = bareWord(textOf(props.accentWord));
  const points = Array.isArray(props.points)
    ? props.points.filter((point): point is string => typeof point === "string").slice(0, 3)
    : [];

  const headingAt = (motionFrame: number) =>
    words({ text: heading, frame: motionFrame, framesPerSecond, startFrame: 0.1 * framesPerSecond, unit });
  const timing = headingAt(0);
  const accentIndex = timing.words.findIndex(
    (word) => accentWord !== "" && bareWord(word.text) === accentWord,
  );
  const underlineStart = (timing.words[accentIndex]?.startFrame ?? 0) + 0.3 * framesPerSecond;
  const pointStarts = sequence({
    count: points.length,
    framesPerSecond,
    startFrame: timing.settleFrame - 0.2 * framesPerSecond,
    eachSeconds: 0.33,
  });
  const settleFrame = Math.max(
    timing.settleFrame,
    underlineStart + 0.7 * framesPerSecond,
    (pointStarts.at(-1) ?? 0) + 0.6 * framesPerSecond,
  );
  const motionFrame = paceFrame({ frame, durationFrames, settleFrame });
  const headingWords = headingAt(motionFrame).words;
  const underline = draw({ frame: motionFrame, framesPerSecond, startFrame: underlineStart });
  const headingDrift = drift({ frame, framesPerSecond, durationFrames, kind: "scale" });

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
      <Backdrop seed="launch-intro" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          padding: 8 * unit,
          paddingBottom: 24 * unit,
          display: "flex",
          flexDirection: tall ? "column" : "row",
          justifyContent: tall ? "center" : "flex-start",
          alignItems: tall ? "stretch" : "center",
          gap: (tall ? 8 : 7) * unit,
        }}
      >
        <h1
          data-text-prop="heading"
          style={{
            margin: 0,
            flex: tall ? "none" : "0 0 62%",
            fontFamily: stylePack.fonts.display.family,
            fontWeight: stylePack.fonts.display.weight,
            fontSize: (tall ? 14 : 12) * unit,
            lineHeight: 1.08,
            overflowWrap: "anywhere",
            transform: headingDrift.transform,
            transformOrigin: "left bottom",
          }}
        >
          {headingWords.map((word, index) => (
            <span key={index}>
              {index === 0 ? "" : " "}
              <span
                style={{
                  display: "inline-block",
                  position: "relative",
                  color: index === accentIndex ? stylePack.colors.accent : "inherit",
                  ...word.style,
                }}
              >
                {word.text}
                {index === accentIndex && underline > 0.02 ? (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      bottom: -0.4 * unit,
                      height: 1.1 * unit,
                      width: String(underline * 100) + "%",
                      borderRadius: 0.55 * unit,
                      background: stylePack.colors.accent,
                    }}
                  />
                ) : null}
              </span>
            </span>
          ))}
        </h1>
        <div style={{ flex: tall ? "none" : 1, display: "flex", flexDirection: "column", gap: 3 * unit }}>
          {points.map((point, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2.5 * unit,
                fontSize: (tall ? 7.5 : 5.5) * unit,
                lineHeight: 1.2,
                ...enter({ frame: motionFrame, framesPerSecond, startFrame: pointStarts[index] ?? 0, kind: "slide-left", unit }),
              }}
            >
              <div style={{ flex: "none", width: 1.2 * unit, height: 1.2 * unit, borderRadius: "50%", background: stylePack.colors.accent }} />
              <span data-text-prop={"points." + String(index)} style={{ overflowWrap: "anywhere" }}>
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
`,
} as const;
