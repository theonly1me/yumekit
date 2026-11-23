import { describe, expect, it } from "vitest";
import { cameraMoveCatalog, cameraMoveIds, findCameraMove } from "../index.js";

const wordsOf = (text: string) =>
  text.split(/\s+/).filter((word) => word !== "");
const dashes = [0x2013, 0x2014].map((codePoint) =>
  String.fromCodePoint(codePoint),
);

describe("the camera move catalog", () => {
  it("has the 16 moves of document 16 in their order", () => {
    expect(cameraMoveCatalog.map((move) => move.id)).toEqual([
      "static",
      "push-in",
      "pull-out",
      "pan-left",
      "pan-right",
      "tilt-up",
      "tilt-down",
      "orbit",
      "crane-up",
      "drone-rise",
      "tracking",
      "handheld",
      "crash-zoom",
      "dolly-zoom",
      "top-down",
      "low-angle",
    ]);
  });

  it("gives each move one sentence for the prompt under 25 words, and one line for the person", () => {
    for (const move of cameraMoveCatalog) {
      expect(wordsOf(move.sentence).length, move.id).toBeLessThan(25);
      expect(move.sentence, move.id).toMatch(/^[A-Z][^.!?]*\.$/);
      expect(move.line, move.id).toMatch(/\.$/);
      expect(move.name, move.id).not.toBe("");
    }
  });

  it("uses no dash and no word for the person that the interface never says", () => {
    for (const move of cameraMoveCatalog) {
      for (const dash of dashes) {
        expect(`${move.sentence}${move.line}${move.name}`).not.toContain(dash);
      }
      expect(move.line.toLowerCase(), move.id).not.toMatch(
        /\b(frame|track|asset)\b/,
      );
    }
  });

  it("finds a move by id, and gives nothing for an unknown id", () => {
    expect(findCameraMove("orbit")?.name).toBe("Orbit");
    expect(findCameraMove("spin")).toBeUndefined();
    expect(new Set(cameraMoveIds).size).toBe(16);
  });
});
