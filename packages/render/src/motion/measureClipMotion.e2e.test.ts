import { describe, expect, it } from "vitest";
import { measureClipMotion, type ClipMotion } from "../index.js";
import { temporaryFolder } from "../testing/renderProject.js";
import {
  changedPicture,
  clipFilters,
  clipOf,
  firstPictureOfTheClips,
  whiteSquareInput,
} from "../testing/syntheticClips.js";

async function measured(options: {
  name: keyof typeof clipFilters;
  startPicture?: "its own" | "another" | "redrawn";
}): Promise<ClipMotion> {
  const folder = await temporaryFolder();
  const file = await clipOf({
    folder,
    name: options.name,
    filter: clipFilters[options.name],
    ...(options.name === "squareInTheTopLeft"
      ? { secondInput: whiteSquareInput }
      : {}),
  });
  const startPicture =
    options.startPicture === "its own"
      ? await firstPictureOfTheClips(folder)
      : options.startPicture === undefined
        ? undefined
        : await changedPicture({ folder, change: options.startPicture });
  const result = await measureClipMotion({
    file,
    ...(startPicture === undefined ? {} : { startPicture }),
  });
  if (!result.ok) throw new Error(result.failure.message);
  return result.value;
}

function kindsOf(motion: ClipMotion): string[] {
  return motion.warnings.map((warning) => warning.kind);
}

describe("measureClipMotion", () => {
  it("calls a clip of one still picture almost still", async () => {
    const motion = await measured({ name: "still" });

    expect(motion.motion).toBeLessThan(0.1);
    expect(kindsOf(motion)).toEqual(["almost-still"]);
  });

  it("finds the camera in a pan of a still and says only the camera moves", async () => {
    const motion = await measured({ name: "panOfAStill" });

    expect(motion.cameraMotion).toBeCloseTo(6.25, 0);
    expect(kindsOf(motion)).toEqual(["only-camera-moves"]);
  });

  it("puts the motion of a moving square in its part of the picture", async () => {
    const motion = await measured({ name: "squareInTheTopLeft" });
    const [topLeft, ...others] = motion.regions;

    expect(topLeft).toBeGreaterThan(0.6);
    expect(Math.max(...others)).toBeLessThan(0.1);
    expect(kindsOf(motion)).toEqual(["still-background"]);
  });

  it("warns at the step of a hard cut", async () => {
    const motion = await measured({ name: "cutInTheMiddle" });
    const [jump] = motion.warnings;

    expect(jump?.kind).toBe("hard-jump");
    expect(jump?.seconds).toBeGreaterThanOrEqual(1.5);
    expect(jump?.seconds).toBeLessThanOrEqual(1.75);
  });

  it("measures no start difference for a clip that starts on its picture", async () => {
    const motion = await measured({ name: "still", startPicture: "its own" });

    expect(motion.startDifference?.whole).toBeLessThan(1);
    expect(kindsOf(motion)).not.toContain(
      "does-not-start-on-the-start-picture",
    );
  });

  it("warns only when the first frame is another picture than the start picture", async () => {
    const motion = await measured({ name: "still", startPicture: "another" });

    expect(motion.startDifference?.whole).toBeGreaterThan(10);
    expect(kindsOf(motion)).toContain("does-not-start-on-the-start-picture");
  });

  it("reports a redrawn start picture as a number without a warning", async () => {
    const motion = await measured({ name: "still", startPicture: "redrawn" });

    expect(motion.startDifference?.whole).toBeGreaterThan(3);
    expect(kindsOf(motion)).not.toContain(
      "does-not-start-on-the-start-picture",
    );
  });
});
