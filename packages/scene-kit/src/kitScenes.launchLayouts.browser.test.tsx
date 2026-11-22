import { describe, expect, it } from "vitest";
import { boxOf, mountSettled, unitPixels } from "./testing/layoutBoxes.js";
import { tallOutput, wideOutput } from "./testing/mountKitScene.js";
import { testImageAsset, typicalProps } from "./testing/sampleProps.js";

type LaunchName =
  "compare" | "steps" | "stat" | "logo-reveal" | "split" | "device" | "chat";

async function settled(options: { name: LaunchName; layout: "wide" | "tall" }) {
  return mountSettled({
    name: options.name,
    props: typicalProps[options.name],
    output: options.layout === "wide" ? wideOutput : tallOutput,
    assets: { photo: await testImageAsset() },
  });
}

function textBox(options: { frame: HTMLElement; textProp: string }): DOMRect {
  return boxOf({
    frame: options.frame,
    element: options.frame.querySelector(
      `[data-text-prop="${options.textProp}"]`,
    ),
  });
}

function pictureShell(frame: HTMLElement): DOMRect {
  const shell = [...frame.querySelectorAll('[aria-hidden="true"]')].find(
    (element) => element.querySelector("img") !== null,
  );
  return boxOf({ frame, element: shell });
}

const pairs: {
  name: LaunchName;
  first: string;
  second: string;
}[] = [
  { name: "compare", first: "left", second: "right" },
  { name: "steps", first: "steps.0", second: "steps.1" },
  { name: "stat", first: "label", second: "label" },
];

describe("side by side in wide, stacked in tall", () => {
  for (const pair of pairs.filter((entry) => entry.name !== "stat")) {
    it(`puts ${pair.second} of ${pair.name} beside ${pair.first} in wide`, async () => {
      const frame = await settled({ name: pair.name, layout: "wide" });
      const first = textBox({ frame, textProp: pair.first });
      const second = textBox({ frame, textProp: pair.second });

      expect(second.left).toBeGreaterThan(first.right);
      expect(Math.abs(second.top - first.top)).toBeLessThan(unitPixels);
    });

    it(`puts ${pair.second} of ${pair.name} below ${pair.first} in tall`, async () => {
      const frame = await settled({ name: pair.name, layout: "tall" });
      const first = textBox({ frame, textProp: pair.first });
      const second = textBox({ frame, textProp: pair.second });

      expect(second.top).toBeGreaterThan(first.bottom);
      expect(Math.abs(second.left - first.left)).toBeLessThan(5 * unitPixels);
    });
  }

  it("puts the label of stat right of the number in wide and below it in tall", async () => {
    const wide = await settled({ name: "stat", layout: "wide" });
    const tall = await settled({ name: "stat", layout: "tall" });
    const numberOf = (frame: HTMLElement) =>
      boxOf({
        frame,
        element: [...frame.querySelectorAll("p")].find(
          (paragraph) => paragraph.textContent === "98%",
        ),
      });

    expect(textBox({ frame: wide, textProp: "label" }).left).toBeGreaterThan(
      numberOf(wide).right,
    );
    expect(textBox({ frame: tall, textProp: "label" }).top).toBeGreaterThan(
      numberOf(tall).bottom,
    );
  });

  it("puts the name of logo-reveal right of the ring in wide and below it in tall", async () => {
    const wide = await settled({ name: "logo-reveal", layout: "wide" });
    const tall = await settled({ name: "logo-reveal", layout: "tall" });
    const ringOf = (frame: HTMLElement) =>
      boxOf({ frame, element: frame.querySelector("svg") });

    expect(textBox({ frame: wide, textProp: "name" }).left).toBeGreaterThan(
      ringOf(wide).right,
    );
    expect(textBox({ frame: tall, textProp: "name" }).top).toBeGreaterThan(
      ringOf(tall).bottom,
    );
  });

  it("fills the left half with the picture of split in wide and the top half in tall", async () => {
    const wide = await settled({ name: "split", layout: "wide" });
    const tall = await settled({ name: "split", layout: "tall" });

    expect(pictureShell(wide)).toEqual(new DOMRect(0, 0, 960, 1080));
    expect(pictureShell(tall)).toEqual(new DOMRect(0, 0, 1080, 960));
    expect(textBox({ frame: wide, textProp: "heading" }).left).toBeGreaterThan(
      960,
    );
    expect(textBox({ frame: tall, textProp: "heading" }).top).toBeGreaterThan(
      960,
    );
  });

  it("draws a browser window in wide and a phone in tall", async () => {
    const wide = pictureShell(
      await settled({ name: "device", layout: "wide" }),
    );
    const tall = pictureShell(
      await settled({ name: "device", layout: "tall" }),
    );

    expect(wide.width / wide.height).toBeGreaterThan(1.4);
    expect(tall.height / tall.width).toBeGreaterThan(2);
  });

  it("aligns the request of chat to the right and the answer to the left", async () => {
    for (const layout of ["wide", "tall"] as const) {
      const frame = await settled({ name: "chat", layout });
      const request = textBox({ frame, textProp: "request" });
      const answer = textBox({ frame, textProp: "answer" });

      expect(request.right).toBeGreaterThan(answer.right);
      expect(answer.left).toBeLessThan(request.left);
      expect(answer.top).toBeGreaterThan(request.bottom);
    }
  });
});
