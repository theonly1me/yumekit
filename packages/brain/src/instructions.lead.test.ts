import { describe, expect, it } from "vitest";
import { brainInstructions } from "./index.js";

describe("the instructions of the lead agent", () => {
  it("read the whole work first and write it back as one piece", () => {
    expect(brainInstructions).toContain(
      "2. Call get_work first: it gives the whole video in one text.",
    );
    expect(brainInstructions).toContain(
      "write the shared parts first (the frame, the type styles, the timing), then the scenes that use them, and send them with the timeline in one put_work call.",
    );
  });

  it("keep the film calm: few things, one idea, cuts on the bar, the same margins, and no voice unless asked", () => {
    expect(brainInstructions).toContain(
      "27. Show few things on screen, and one idea in each scene. Cut on the bar: give each scene a whole number of bars. Use the same margins in each scene, from the shared code.",
    );
    expect(brainInstructions).toContain(
      "28. Make no voice unless the person asks for one, or the video has a voice now.",
    );
    expect(brainInstructions).toContain(
      "Make it in one call, never one recording for each line.",
    );
  });

  it("use the exact inputs of a request from a button, and brief a helper with the ids it may change", () => {
    expect(brainInstructions).toContain(
      "29. A request from a button of the editor names the exact tool inputs: the server, the model, and the settings. Use them as given.",
    );
    expect(brainInstructions).toContain(
      "you can give a clear brief to a helper with ask_helper. Name the scene ids or the asset ids that it may change.",
    );
  });
});
