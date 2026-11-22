import { describe, expect, it } from "vitest";
import { folderNameOf, projectNameOf } from "./projectNames.js";

describe("the names of a new project", () => {
  it("takes the first six words of the first line, in lower case with hyphens, for the folder", () => {
    expect(folderNameOf("Café au lait: a short video!\nMore text")).toBe(
      "cafe-au-lait-a-short-video",
    );
  });

  it("gives a folder name with no dot segment and no slash, also for a request of only symbols", () => {
    expect(folderNameOf("../..")).toBe("video");
    expect(folderNameOf("..\\..\\windows")).toBe("windows");
  });

  it("takes the first six words for the project name, with a capital letter and no end punctuation", () => {
    expect(projectNameOf("tea, a video.")).toBe("Tea, a video");
    expect(projectNameOf("   ")).toBe("New video");
  });
});
