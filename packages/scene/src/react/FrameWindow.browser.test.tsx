import { describe, expect, it } from "vitest";
import { defineReactScene, FrameWindow, useFrame } from "../index.js";
import { mountForTest } from "./mountForTest.js";

function WindowFrame() {
  return <span>inside {useFrame()}</span>;
}

const windowScene = defineReactScene(() => (
  <FrameWindow startFrame={5} durationFrames={3}>
    <WindowFrame />
  </FrameWindow>
));

const nestedScene = defineReactScene(() => (
  <FrameWindow startFrame={10} durationFrames={20}>
    <FrameWindow startFrame={4} durationFrames={2}>
      <WindowFrame />
    </FrameWindow>
  </FrameWindow>
));

async function textAtFrames(options: { frames: number[]; nested: boolean }) {
  const { element, mounted } = await mountForTest({
    scene: options.nested ? nestedScene : windowScene,
    durationFrames: 40,
  });
  const texts: string[] = [];
  for (const frame of options.frames) {
    await mounted.seek(frame);
    texts.push(element.textContent);
  }
  return texts;
}

describe("FrameWindow", () => {
  it("hides its children before and after the window", async () => {
    expect(
      await textAtFrames({ frames: [0, 4, 8, 39], nested: false }),
    ).toEqual(["", "", "", ""]);
  });

  it("restarts useFrame at 0 on the start frame", async () => {
    expect(await textAtFrames({ frames: [5, 6, 7], nested: false })).toEqual([
      "inside 0",
      "inside 1",
      "inside 2",
    ]);
  });

  it("counts a nested window from the start of its parent window", async () => {
    expect(
      await textAtFrames({ frames: [13, 14, 15, 16], nested: true }),
    ).toEqual(["", "inside 0", "inside 1", ""]);
  });
});
