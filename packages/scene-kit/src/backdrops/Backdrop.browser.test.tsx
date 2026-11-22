import { defineReactScene } from "@yumekit/scene";
import { describe, expect, it, onTestFinished } from "vitest";
import { page } from "vitest/browser";
import { Backdrop, backdropKinds, type BackdropKind } from "../index.js";
import { testLook } from "../testing/testLook.js";

const output = { id: "wide", widthPixels: 480, heightPixels: 270 };

async function mountBackdrop(options: { kind: BackdropKind; seed?: string }) {
  const scene = defineReactScene(() => (
    <Backdrop
      kind={options.kind}
      stylePack={testLook}
      seed={options.seed ?? "scene-one"}
    />
  ));
  const element = document.createElement("div");
  element.style.position = "relative";
  element.style.width = `${String(output.widthPixels)}px`;
  element.style.height = `${String(output.heightPixels)}px`;
  document.body.append(element);
  const mounted = await scene.mount({
    element,
    output,
    framesPerSecond: 30,
    durationFrames: 90,
    props: {},
    findAsset: () => undefined,
  });
  onTestFinished(() => {
    mounted.dispose();
    element.remove();
  });
  const pictureAt = async (frame: number) => {
    await mounted.seek(frame);
    return page.screenshot({ element, save: false });
  };
  return { element, mounted, pictureAt };
}

describe("Backdrop", () => {
  for (const kind of backdropKinds) {
    it(`draws the same ${kind} picture at frame 60 after a seek and after frames 0 to 59`, async () => {
      const { mounted, pictureAt } = await mountBackdrop({ kind });
      const direct = await pictureAt(60);
      for (let frame = 0; frame < 60; frame += 1) {
        await mounted.seek(frame);
      }
      expect(await pictureAt(60)).toBe(direct);
    });
  }

  for (const kind of ["glow", "grid"] as const) {
    it(`moves the ${kind} backdrop between two frames`, async () => {
      const { pictureAt } = await mountBackdrop({ kind });
      expect(await pictureAt(0)).not.toBe(await pictureAt(15));
    });
  }

  it("keeps the flat and grain backdrops the same on each frame", async () => {
    for (const kind of ["flat", "grain"] as const) {
      const { pictureAt } = await mountBackdrop({ kind });
      expect(await pictureAt(0)).toBe(await pictureAt(45));
    }
  });

  it("draws a different glow for a different seed", async () => {
    const first = await mountBackdrop({ kind: "glow", seed: "scene-one" });
    const firstPicture = await first.pictureAt(0);
    first.element.remove();
    const second = await mountBackdrop({ kind: "glow", seed: "scene-two" });
    expect(await second.pictureAt(0)).not.toBe(firstPicture);
  });

  it("fills the flat backdrop with the background color of the look", async () => {
    const { element, mounted } = await mountBackdrop({ kind: "flat" });
    await mounted.seek(0);
    const backdrop = element.querySelector("[data-backdrop]");
    expect(backdrop?.getAttribute("data-backdrop")).toBe("flat");
    expect(
      backdrop === null ? "" : getComputedStyle(backdrop).backgroundColor,
    ).toBe("rgb(11, 13, 26)");
  });
});
