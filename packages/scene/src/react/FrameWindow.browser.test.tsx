import { describe, expect, it } from "vitest";
import {
  defineReactScene,
  FrameWindow,
  useFrame,
  type SceneModule,
} from "../index.js";
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

const openEndedScene = defineReactScene(() => (
  <FrameWindow startFrame={30}>
    <WindowFrame />
  </FrameWindow>
));

async function textAtFrames(options: { frames: number[]; scene: SceneModule }) {
  const { element, mounted } = await mountForTest({
    scene: options.scene,
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
      await textAtFrames({ frames: [0, 4, 8, 39], scene: windowScene }),
    ).toEqual(["", "", "", ""]);
  });

  it("restarts useFrame at 0 on the start frame", async () => {
    expect(
      await textAtFrames({ frames: [5, 6, 7], scene: windowScene }),
    ).toEqual(["inside 0", "inside 1", "inside 2"]);
  });

  it("counts a nested window from the start of its parent window", async () => {
    expect(
      await textAtFrames({ frames: [13, 14, 15, 16], scene: nestedScene }),
    ).toEqual(["", "inside 0", "inside 1", ""]);
  });

  it("lasts to the end of the clip when it has no durationFrames", async () => {
    expect(
      await textAtFrames({ frames: [29, 30, 39], scene: openEndedScene }),
    ).toEqual(["", "inside 0", "inside 9"]);
  });
});
