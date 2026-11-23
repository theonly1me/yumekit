import { checkSceneCode } from "@yumekit/render";
import { describe, expect, it } from "vitest";
import { sceneGuide } from "./index.js";

const callsWithEachOption = {
  enter:
    'enter({ frame, framesPerSecond, startFrame: 0, kind: "pop", durationSeconds: 0.6, unit, distanceUnits: 5, calm: false })',
  exit: 'exit({ frame, framesPerSecond, endFrame: 30, kind: "fade", durationSeconds: 0.6, unit, distanceUnits: 5, calm: false })',
  sequence:
    'sequence({ count: 3, framesPerSecond, startFrame: 0, eachSeconds: 0.15, itemSeconds: 0.6, durationFrames, every: "beat", beatFrames })',
  words:
    'words({ text: "a b", frame, framesPerSecond, startFrame: 0, kind: "rise", unit, distanceUnits: 5, calm: false, eachSeconds: 0.09, wordSeconds: 0.6 })',
  typed:
    'typed({ text: "hi", frame, framesPerSecond, startFrame: 0, charactersPerSecond: 24, blinkSeconds: 0.5 })',
  countUp:
    'countUp({ frame, framesPerSecond, to: 9, from: 0, startFrame: 0, durationSeconds: 1, fractionDigits: 0, prefix: "$", suffix: "%" })',
  drift:
    'drift({ frame, framesPerSecond, durationFrames, kind: "turn", amount: 1, unit, seed: "a", calm: false })',
  pulse:
    "pulse({ frame, framesPerSecond, atFrame: 10, amount: 0.08, durationSeconds: 0.4 })",
  draw: "draw({ frame, framesPerSecond, startFrame: 0, durationSeconds: 0.7 })",
  holdSplit: "holdSplit({ durationFrames })",
  paceFrame: "paceFrame({ frame, durationFrames, settleFrame: 20 })",
} as const;

const resultReads = [
  "enter.transform",
  "exit.opacity",
  "sequence[0]",
  "words.words[0]?.style.opacity",
  "words.settleFrame",
  "typed.shown",
  "typed.cursorVisible",
  "countUp.text",
  "drift.transform",
  "pulse",
  "draw",
  "holdSplit.hold.startFrame",
  "holdSplit.settleFrame",
  "paceFrame",
];

function optionNamesOf(call: string): string[] {
  const inside = call.slice(call.indexOf("{") + 1, call.lastIndexOf("}"));
  return inside.split(",").map((part) => part.split(":")[0]?.trim() ?? "");
}

function guideOptionNamesOf(name: string): string[] {
  const line =
    sceneGuide.split("\n").find((text) => text.startsWith(`- \`${name}({`)) ??
    "";
  const inside = line.slice(line.indexOf("{") + 1, line.indexOf("})"));
  return inside.split(",").map((part) => part.trim().replace("?", ""));
}

const sceneThatCallsEachFunction = `import { defineReactScene, useFrame, useSceneContext } from "@yumekit/scene";
import { Backdrop } from "@yumekit/scene-kit";
import { countUp, draw, drift, enter, exit, holdSplit, paceFrame, pulse, sequence, typed, words } from "@yumekit/scene-kit/motion";

export default defineReactScene(() => {
  const frame = useFrame();
  const { unit, framesPerSecond, durationFrames, beatFrames } = useSceneContext();
  const results = {
${Object.entries(callsWithEachOption)
  .map(([name, call]) => `    ${name}: ${call},`)
  .join("\n")}
  };
  const reads = [${resultReads.map((read) => `String(results.${read})`).join(", ")}];
  return <div><Backdrop seed="a" kind="glow" />{reads.join(" ")}</div>;
});
`;

describe("the part Motion design of the scene guide", () => {
  it("holds the ten rules in order", () => {
    const rules = [
      "1. One idea in each scene.",
      "2. A scene has three parts:",
      "3. The eye goes to the largest thing first.",
      "4. Things come in one after another, never all at once.",
      "5. Nothing is still.",
      "6. Text is large.",
      "7. A number counts up",
      "8. Take each color and each font from the look.",
      "9. Each platform shape gets its own layout:",
      "10. Check each scene with `preview_scenes`",
    ];
    const positions = rules.map((rule) => sceneGuide.indexOf(rule));

    expect(positions.every((position) => position > 0)).toBe(true);
    expect(
      [...positions.entries()].every(
        ([index, position]) =>
          index === 0 || position > (positions[index - 1] ?? 0),
      ),
    ).toBe(true);
  });

  it("names for each motion function exactly the options that a strict scene compiles with", async () => {
    for (const [name, call] of Object.entries(callsWithEachOption)) {
      expect(guideOptionNamesOf(name)).toEqual(optionNamesOf(call));
    }

    const checked = await checkSceneCode({
      sceneId: "each-function",
      code: sceneThatCallsEachFunction,
    });

    expect(checked).toEqual({ ok: true, value: { checked: true } });
  });

  it("rejects a call with an option that the guide does not name", async () => {
    const checked = await checkSceneCode({
      sceneId: "wrong-option",
      code: sceneThatCallsEachFunction.replace(
        "durationSeconds: 0.7 })",
        "durationSeconds: 0.7, lengthSeconds: 1 })",
      ),
    });

    expect(checked.ok ? "" : checked.failure.kind).toBe("scene-compile-failed");
  });
});
