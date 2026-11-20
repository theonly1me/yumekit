import { describe, expect, it } from "vitest";
import { defineReactScene, tween, useFrame } from "../index.js";
import { mountForTest } from "./mountForTest.js";

const counterScene = defineReactScene(({ props }) => {
  const frame = useFrame();
  const label = typeof props["label"] === "string" ? props["label"] : "frame";
  const width = tween({ frame, startFrame: 0, endFrame: 20, from: 0, to: 100 });
  return (
    <p data-width={width.toFixed(4)}>
      {label} {frame}
    </p>
  );
});

describe("defineReactScene", () => {
  it("shows the requested frame for seeks in the order 10, 3, 10", async () => {
    const { element, mounted } = await mountForTest({
      scene: counterScene,
      durationFrames: 30,
    });
    const shown: (string | null)[] = [];
    for (const frame of [10, 3, 10]) {
      await mounted.seek(frame);
      shown.push(element.textContent);
    }
    expect(shown).toEqual(["frame 10", "frame 3", "frame 10"]);
  });

  it("gives the same markup for two seeks to the same frame", async () => {
    const { element, mounted } = await mountForTest({
      scene: counterScene,
      durationFrames: 30,
    });
    await mounted.seek(7);
    const first = element.innerHTML;
    await mounted.seek(19);
    await mounted.seek(7);
    expect(element.innerHTML).toBe(first);
  });

  it("passes the props to the component", async () => {
    const { element, mounted } = await mountForTest({
      scene: counterScene,
      durationFrames: 30,
      props: { label: "intro" },
    });
    await mounted.seek(2);
    expect(element.textContent).toBe("intro 2");
  });

  it("rejects a frame outside the clip", async () => {
    const { mounted } = await mountForTest({
      scene: counterScene,
      durationFrames: 30,
    });
    await expect(mounted.seek(30)).rejects.toThrow("from 0 to 29");
    await expect(mounted.seek(1.5)).rejects.toThrow("whole number");
  });

  it("removes the picture and rejects a seek after dispose", async () => {
    const { element, mounted } = await mountForTest({
      scene: counterScene,
      durationFrames: 30,
    });
    await mounted.seek(1);
    mounted.dispose();
    expect(element.childElementCount).toBe(0);
    await expect(mounted.seek(1)).rejects.toThrow("disposed");
  });
});
