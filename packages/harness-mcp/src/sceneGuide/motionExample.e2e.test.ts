import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";
import {
  changedPointsOf,
  colorCountOf,
  picturesOf,
} from "../testing/scenePictures.js";
import { motionExample } from "./motionExample.js";

const renderTimeout = 240_000;
const wide = { id: "wide", label: "Wide", widthPixels: 640, heightPixels: 360 };
const tall = { id: "tall", label: "Tall", widthPixels: 360, heightPixels: 640 };
const scale = 0.5;
const edgeUnits = 4;
const captionAreaUnits = 16;

async function harnessWithExample(): Promise<Harness> {
  const harness = await startHarness({ outputs: [wide, tall] });
  for (const [sceneId, props] of [
    ["example", motionExample.props],
    ["no-text", { heading: "", accentWord: "", points: [] }],
  ] as const) {
    const put = await harness.call({
      name: "put_scene",
      arguments: {
        scene_id: sceneId,
        title: sceneId,
        code: motionExample.code,
        props,
      },
    });
    if (put.isError) throw new Error(put.text);
  }
  return harness;
}

describe("the full example of Motion design in the scene guide", () => {
  it(
    "passes the check of put_scene and draws a picture with the look",
    async () => {
      const harness = await startHarness({ outputs: [wide] });

      const put = await harness.call({
        name: "put_scene",
        arguments: {
          scene_id: "example",
          title: "Example",
          code: motionExample.code,
          props: motionExample.props,
        },
      });
      const preview = await harness.call({
        name: "preview_scenes",
        arguments: { output_id: "wide", scene_ids: ["example"] },
      });

      expect(put.isError).toBe(false);
      expect(preview.isError).toBe(false);
      const [picture] = await picturesOf(preview);
      expect(picture === undefined ? 0 : colorCountOf(picture)).toBeGreaterThan(
        50,
      );
    },
    renderTimeout,
  );

  it(
    "keeps each text inside the picture and above the caption area, in two looks, wide and tall, during the entry and settled",
    async () => {
      const harness = await harnessWithExample();
      const checked: string[] = [];

      for (const look of ["midnight", "studio"]) {
        await harness.call({ name: "set_look", arguments: { look } });
        for (const output of [wide, tall]) {
          for (const frame of [10, undefined]) {
            const preview = await harness.call({
              name: "preview_scenes",
              arguments: {
                output_id: output.id,
                scene_ids: ["example", "no-text"],
                scale,
                ...(frame === undefined ? {} : { frame }),
              },
            });
            const [withText, withoutText] = await picturesOf(preview);
            if (withText === undefined || withoutText === undefined) {
              throw new Error(preview.text);
            }
            const unit = Math.min(withText.width, withText.height) / 100;
            const textPoints = changedPointsOf({
              picture: withText,
              other: withoutText,
              threshold: 40,
            });
            const outsidePoints = textPoints.filter(
              (point) =>
                point.x < edgeUnits * unit ||
                point.y < edgeUnits * unit ||
                point.x >= withText.width - edgeUnits * unit ||
                point.y >= withText.height - captionAreaUnits * unit,
            );

            expect(textPoints.length).toBeGreaterThan(200);
            expect(outsidePoints).toEqual([]);
            checked.push(`${look} ${output.id} ${String(frame ?? "settled")}`);
          }
        }
      }

      expect(checked).toHaveLength(8);
    },
    renderTimeout,
  );
});
