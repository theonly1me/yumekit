import type { SceneAsset } from "@yumekit/scene";
import { describe, expect, it } from "vitest";
import { boxOf, unitPixels } from "./testing/layoutBoxes.js";
import { mountKitScene, wideOutput } from "./testing/mountKitScene.js";

const durationFrames = 150;

function linesShown(element: HTMLElement): string[] {
  return [...element.querySelectorAll('[data-text-prop^="lines."]')].map(
    (line) => line.getAttribute("data-text-prop") ?? "",
  );
}

function textOf(options: { element: HTMLElement; textProp: string }): string {
  return (
    options.element.querySelector(`[data-text-prop="${options.textProp}"]`)
      ?.textContent ?? ""
  );
}

const voice: SceneAsset = {
  kind: "audio",
  url: "voice.wav",
  words: [
    { text: "One", startFrame: 0, endFrame: 10 },
    { text: "line.", startFrame: 12, endFrame: 20 },
    { text: "Two", startFrame: 60, endFrame: 70 },
    { text: "Three", startFrame: 100, endFrame: 110 },
  ],
};

describe("the motion of the launch scenes", () => {
  it("shows one line of kinetic at a time and keeps the last line", async () => {
    const { element, mounted } = await mountKitScene({
      name: "kinetic",
      durationFrames,
      props: { lines: ["One line.", "Two", "Three"] },
    });
    await mounted.seek(8);
    expect(linesShown(element)).toEqual(["lines.0"]);
    await mounted.seek(durationFrames - 1);
    expect(linesShown(element)).toEqual(["lines.2"]);
  });

  it("brings each line of kinetic in when the voice says its first word", async () => {
    const { element, mounted } = await mountKitScene({
      name: "kinetic",
      durationFrames,
      props: { lines: ["One line.", "Two", "Three"], assetId: "voice" },
      assets: { voice },
    });
    await mounted.seek(59);
    expect(linesShown(element)).toEqual(["lines.0"]);
    await mounted.seek(60);
    expect(linesShown(element)).toContain("lines.1");
    await mounted.seek(99);
    expect(linesShown(element)).toEqual(["lines.1"]);
    await mounted.seek(100);
    expect(linesShown(element)).toContain("lines.2");
  });

  it("counts the number of stat up from 0", async () => {
    const { element, mounted } = await mountKitScene({
      name: "stat",
      durationFrames,
      props: { value: 98, suffix: "%" },
    });
    const shownNumber = () =>
      Number.parseFloat(
        [...element.querySelectorAll("p")].at(-1)?.textContent ?? "",
      );
    await mounted.seek(0);
    expect(shownNumber()).toBe(0);
    await mounted.seek(20);
    expect(shownNumber()).toBeGreaterThan(0);
    expect(shownNumber()).toBeLessThan(98);
    await mounted.seek(durationFrames - 1);
    expect(shownNumber()).toBe(98);
  });

  it("types the request of chat letter by letter", async () => {
    const request = "Make a launch video";
    const { element, mounted } = await mountKitScene({
      name: "chat",
      durationFrames,
      props: { request, answer: "Done." },
    });
    await mounted.seek(16);
    const typing = textOf({ element, textProp: "request" });
    expect(typing.length).toBeGreaterThan(0);
    expect(typing.length).toBeLessThan(request.length);
    expect(request.startsWith(typing)).toBe(true);
    await mounted.seek(durationFrames - 1);
    expect(textOf({ element, textProp: "request" })).toBe(request);
  });

  it("draws the line under the accent word of hero in the accent of the look", async () => {
    const { element, mounted } = await mountKitScene({
      name: "hero",
      durationFrames,
      props: { heading: "Your idea, as a video.", accentWord: "video" },
      look: "midnight",
    });
    const accent = () =>
      [...element.querySelectorAll("h1 span")].find(
        (span) => span.textContent === "video.",
      );
    await mounted.seek(durationFrames - 1);
    const settled = accent();
    expect(settled === undefined ? "" : getComputedStyle(settled).color).toBe(
      "rgb(255, 182, 55)",
    );
    expect(
      settled === undefined ? "" : getComputedStyle(settled).backgroundSize,
    ).toMatch(/^100% /);
    await mounted.seek(10);
    const entering = element.querySelector("h1 > span:last-child");
    expect(
      entering === null ? "" : getComputedStyle(entering).backgroundSize,
    ).toMatch(/^0% /);
  });

  it("sits the bar of lower-third at the left margin above the caption area", async () => {
    const { element, mounted } = await mountKitScene({
      name: "lower-third",
      durationFrames,
      props: { name: "Aiko Tanaka", role: "Founder" },
      output: wideOutput,
    });
    await mounted.seek(durationFrames - 1);
    const panel = boxOf({
      frame: element,
      element: element.querySelector('[data-text-prop="name"]')?.parentElement,
    });
    expect(panel.left).toBeGreaterThan(8 * unitPixels);
    expect(panel.left).toBeLessThan(10 * unitPixels);
    expect(panel.bottom).toBeCloseTo(1080 - 19 * unitPixels, 0);
  });
});
