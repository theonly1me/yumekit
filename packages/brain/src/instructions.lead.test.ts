import { describe, expect, it } from "vitest";
import { brainInstructions } from "./index.js";

describe("the instructions of the lead agent", () => {
  it("read the whole work first and write it back as one piece", () => {
    expect(brainInstructions).toContain(
      "2. Call get_work first: it gives the whole video in one text.",
    );
    expect(brainInstructions).toContain(
      "set the look first, use the film kit scenes where they fit, write scene code only for what no kit scene shows, and send the scenes with the timeline in one put_work call.",
    );
  });

  it("keep the film calm: few things, one idea, cuts on the bar, the same margins, and no voice unless asked", () => {
    expect(brainInstructions).toContain(
      "27. Show few things on screen, and one idea in each scene. Cut on the bar: give each scene a whole number of bars. Use the same margins in each scene: the kit scenes share them.",
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

  it("act first on a message that the person sends while the AI works, and let a choice of the person override a check", () => {
    expect(brainInstructions).toContain(
      "39. A message from the person can come in the answer of any tool call, under the title A MESSAGE FROM THE PERSON. It is the person speaking now. Act on it first",
    );
    expect(brainInstructions).toContain(
      "A choice of the person of a clip, a picture, or music overrides a check.",
    );
    expect(brainInstructions).toContain("person_chose_this_clip");
  });
});
