import { describe, expect, it } from "vitest";
import {
  defineReactScene,
  useSceneContext,
  type SceneOutput,
} from "../index.js";
import { mountForTest } from "./mountForTest.js";

const layoutScene = defineReactScene(() => {
  const { layout, unit } = useSceneContext();
  return (
    <p>
      {layout} {unit}
    </p>
  );
});

async function layoutAndUnit(output: SceneOutput) {
  const { element, mounted } = await mountForTest({
    scene: layoutScene,
    durationFrames: 1,
    output,
  });
  await mounted.seek(0);
  return element.textContent;
}

function outputOf(options: {
  widthPixels: number;
  heightPixels: number;
}): SceneOutput {
  return { id: "output", ...options };
}

describe("useSceneContext layout and unit", () => {
  it("is wide with a unit of 1 percent of the height for 1920 by 1080", async () => {
    expect(
      await layoutAndUnit(outputOf({ widthPixels: 1920, heightPixels: 1080 })),
    ).toBe("wide 10.8");
  });

  it("is tall with a unit of 1 percent of the width for 1080 by 1920", async () => {
    expect(
      await layoutAndUnit(outputOf({ widthPixels: 1080, heightPixels: 1920 })),
    ).toBe("tall 10.8");
  });

  it("is square for 1080 by 1080", async () => {
    expect(
      await layoutAndUnit(outputOf({ widthPixels: 1080, heightPixels: 1080 })),
    ).toBe("square 10.8");
  });

  it("is wide at a ratio of exactly 1.2 and tall at exactly 0.8", async () => {
    expect(
      await layoutAndUnit(outputOf({ widthPixels: 1200, heightPixels: 1000 })),
    ).toBe("wide 10");
    expect(
      await layoutAndUnit(outputOf({ widthPixels: 800, heightPixels: 1000 })),
    ).toBe("tall 8");
  });

  it("is square just inside both limits", async () => {
    expect(
      await layoutAndUnit(outputOf({ widthPixels: 1190, heightPixels: 1000 })),
    ).toBe("square 10");
    expect(
      await layoutAndUnit(outputOf({ widthPixels: 810, heightPixels: 1000 })),
    ).toBe("square 8.1");
  });
});
