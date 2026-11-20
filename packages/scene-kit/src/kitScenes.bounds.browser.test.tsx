import type { JsonObject, SceneOutput } from "@yumekit/scene";
import { describe, expect, it } from "vitest";
import { kitScenes } from "./index.js";
import { rectsOutside, textRectCount } from "./testing/contentBoxes.js";
import {
  mountKitScene,
  tallOutput,
  wideOutput,
} from "./testing/mountKitScene.js";
import {
  kitSceneNames,
  longProps,
  longText,
  testImageAsset,
  typicalProps,
} from "./testing/sampleProps.js";

const durationFrames = 150;
const checkedFrames = [0, 40, 149];
const outputs = [wideOutput, tallOutput];

async function outsideAtFrames(options: {
  name: string;
  props: JsonObject;
  output: SceneOutput;
}) {
  const { element, mounted } = await mountKitScene({
    ...options,
    durationFrames,
    assets: { photo: await testImageAsset() },
  });
  const found: { frame: number; outside: number; texts: number }[] = [];
  for (const frame of checkedFrames) {
    await mounted.seek(frame);
    found.push({
      frame,
      outside: rectsOutside(element).length,
      texts: textRectCount(element),
    });
  }
  return found;
}

describe("kit scene content stays inside the picture", () => {
  it("has a kit scene for each component name of the design", () => {
    expect(Object.keys(kitScenes).toSorted()).toEqual(
      [...kitSceneNames].toSorted(),
    );
  });

  for (const output of outputs) {
    for (const name of kitSceneNames) {
      it(`keeps ${name} inside ${String(output.widthPixels)} by ${String(output.heightPixels)}`, async () => {
        const found = await outsideAtFrames({
          name,
          props: typicalProps[name],
          output,
        });
        expect(found.map((entry) => entry.outside)).toEqual([0, 0, 0]);
        expect(found.at(-1)?.texts).toBeGreaterThan(0);
      });

      it(`keeps long text of ${name} inside ${String(output.widthPixels)} by ${String(output.heightPixels)}`, async () => {
        const found = await outsideAtFrames({
          name,
          props: longProps[name],
          output,
        });
        expect(found.map((entry) => entry.outside)).toEqual([0, 0, 0]);
        expect(found.at(-1)?.texts).toBeGreaterThan(0);
      });
    }
  }

  it("uses a title of 120 characters for the long text", () => {
    expect(longText).toHaveLength(120);
  });
});
