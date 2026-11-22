import { describe, expect, it } from "vitest";
import { fileNameOfDisposition } from "../files/saveAssetFile.js";
import { repeatedClipsOf } from "./soundTimelines.js";

describe("the clips of the music of the person", () => {
  it("repeats a short file and cuts the last clip at the end of the video", () => {
    expect(repeatedClipsOf({ assetFrames: 45, videoFrames: 100 })).toEqual([
      { startFrame: 0, durationFrames: 45 },
      { startFrame: 45, durationFrames: 45 },
      { startFrame: 90, durationFrames: 10 },
    ]);
  });

  it("cuts a long file to the length of the video", () => {
    expect(repeatedClipsOf({ assetFrames: 300, videoFrames: 60 })).toEqual([
      { startFrame: 0, durationFrames: 60 },
    ]);
  });

  it("makes no clip for a video with no length", () => {
    expect(repeatedClipsOf({ assetFrames: 30, videoFrames: 0 })).toEqual([]);
  });
});

describe("the name of a saved file", () => {
  it("prefers the full name of filename* to the plain name", () => {
    expect(
      fileNameOfDisposition({
        header: `attachment; filename="Caf_.mp3"; filename*=UTF-8''Caf%C3%A9.mp3`,
        fallback: "tune",
      }),
    ).toBe("Café.mp3");
  });

  it("uses the fallback with no header", () => {
    expect(fileNameOfDisposition({ header: null, fallback: "tune" })).toBe(
      "tune",
    );
  });
});
