import type { JsonObject, SceneOutput } from "@yumekit/scene";
import { describe, expect, it } from "vitest";
import {
  panelRectsAboveCaptionArea,
  textRectCount,
  textRectsInCaptionArea,
} from "./testing/contentBoxes.js";
import {
  mountKitScene,
  squareOutput,
  tallOutput,
  wideOutput,
} from "./testing/mountKitScene.js";
import {
  kitSceneNames,
  longProps,
  testImageAsset,
  typicalProps,
} from "./testing/sampleProps.js";

const durationFrames = 150;
const checkedFrames = [0, 40, 149];
const outputs = [wideOutput, tallOutput, squareOutput];
const sceneNamesWithCaptions = ["caption-words", "video-clip"] as const;
const sceneNamesWithoutCaptions = kitSceneNames.filter(
  (name) => !sceneNamesWithCaptions.some((captioned) => captioned === name),
);

async function countsAtFrames(options: {
  name: string;
  props: JsonObject;
  output: SceneOutput;
}) {
  const { element, mounted } = await mountKitScene({
    ...options,
    durationFrames,
    assets: { photo: await testImageAsset() },
  });
  const counts: { inCaptionArea: number; aboveCaptionArea: number }[] = [];
  for (const frame of checkedFrames) {
    await mounted.seek(frame);
    counts.push({
      inCaptionArea: textRectsInCaptionArea(element).length,
      aboveCaptionArea: panelRectsAboveCaptionArea(element).length,
    });
  }
  return { counts, texts: textRectCount(element) };
}

const propsBySize = { typical: typicalProps, long: longProps };

describe("the caption area at the bottom 16 units", () => {
  for (const output of outputs) {
    const size = `${String(output.widthPixels)} by ${String(output.heightPixels)}`;
    for (const [propsName, props] of Object.entries(propsBySize)) {
      for (const name of sceneNamesWithoutCaptions) {
        it(`keeps the ${propsName} text of ${name} out of it in ${size}`, async () => {
          const { counts, texts } = await countsAtFrames({
            name,
            props: props[name],
            output,
          });
          expect(counts.map((count) => count.inCaptionArea)).toEqual([0, 0, 0]);
          expect(texts).toBeGreaterThan(0);
        });
      }

      for (const name of sceneNamesWithCaptions) {
        it(`keeps the ${propsName} caption panel of ${name} inside it in ${size}`, async () => {
          const { counts, texts } = await countsAtFrames({
            name,
            props: props[name],
            output,
          });
          expect(counts.map((count) => count.aboveCaptionArea)).toEqual([
            0, 0, 0,
          ]);
          expect(texts).toBeGreaterThan(0);
        });
      }
    }
  }
});
