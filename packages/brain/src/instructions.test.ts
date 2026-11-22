import { describe, expect, it } from "vitest";
import { brainInstructions } from "./index.js";

describe("the instructions for the agent", () => {
  it("leave the export to the person and check the work with preview pictures", () => {
    expect(brainInstructions).toContain(
      "Do not call render_video unless the person asks for the video file.",
    );
    expect(brainInstructions).toContain(
      "To check your work, look at preview pictures with preview_frame.",
    );
  });

  it("name a version of the video by its platform, not by an output id", () => {
    expect(brainInstructions).toContain(
      'Name a version of the video by its platform, for example "the YouTube version". Never name it by an output id such as wide or tall.',
    );
  });

  it("go on with the rest of the video when a paid tool has no key", () => {
    expect(brainInstructions).toContain(
      "If a paid tool for a step has no key, say in one sentence which key is missing and that the person can add it in Settings. Then make the rest of the video.",
    );
  });
});
