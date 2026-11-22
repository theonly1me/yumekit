import { describe, expect, it } from "vitest";
import { lookIds } from "../index.js";
import { rectsOutside, textRectCount } from "../testing/contentBoxes.js";
import {
  mountKitScene,
  squareOutput,
  tallOutput,
  wideOutput,
} from "../testing/mountKitScene.js";
import {
  kitSceneNames,
  longProps,
  testImageAsset,
  typicalProps,
} from "../testing/sampleProps.js";

const durationFrames = 150;
const checkedFrames = [0, 40, 149];
const outputs = [wideOutput, tallOutput, squareOutput];

describe("kit scenes in each look", () => {
  for (const look of lookIds) {
    for (const output of outputs) {
      const size = `${String(output.widthPixels)} by ${String(output.heightPixels)}`;
      for (const name of kitSceneNames) {
        it(`keeps the text of ${name} inside ${size} in ${look}`, async () => {
          for (const props of [typicalProps[name], longProps[name]]) {
            const { element, mounted } = await mountKitScene({
              name,
              props,
              output,
              look,
              durationFrames,
              assets: { photo: await testImageAsset() },
            });
            for (const frame of checkedFrames) {
              await mounted.seek(frame);
              expect({ frame, outside: rectsOutside(element).length }).toEqual({
                frame,
                outside: 0,
              });
            }
            expect(textRectCount(element)).toBeGreaterThan(0);
          }
        });
      }
    }
  }
});
