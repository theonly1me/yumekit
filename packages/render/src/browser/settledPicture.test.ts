import { describe, expect, it } from "vitest";
import { settledPicture } from "./settledPicture.js";

function picturesInTurn(pictures: number[][]) {
  let taken = 0;
  return {
    take: () => {
      const picture = pictures[Math.min(taken, pictures.length - 1)] ?? [];
      taken += 1;
      return Promise.resolve(Uint8Array.from(picture));
    },
    count: () => taken,
  };
}

describe("a settled picture", () => {
  it("skips a first picture that the browser had not finished, and gives the picture that two takes agree on", async () => {
    const browser = picturesInTurn([
      [1, 9],
      [1, 2],
      [1, 2],
    ]);

    const picture = await settledPicture(browser.take);

    expect([...picture]).toEqual([1, 2]);
    expect(browser.count()).toBe(3);
  });

  it("takes two pictures when the first is already settled", async () => {
    const browser = picturesInTurn([[3, 4]]);

    expect([...(await settledPicture(browser.take))]).toEqual([3, 4]);
    expect(browser.count()).toBe(2);
  });

  it("stops after five pictures when no two agree, and gives the last one", async () => {
    const browser = picturesInTurn([[1], [2], [3], [4], [5], [6]]);

    expect([...(await settledPicture(browser.take))]).toEqual([5]);
    expect(browser.count()).toBe(5);
  });
});
