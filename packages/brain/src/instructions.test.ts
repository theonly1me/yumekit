import { describe, expect, it } from "vitest";
import { brainInstructions, instructionsOf } from "./index.js";

describe("the instructions for the agent", () => {
  it("leave the export to the person and check the work with preview pictures", () => {
    expect(brainInstructions).toContain(
      "Do not call render_video unless the person asks for the video file.",
    );
    expect(brainInstructions).toContain(
      "To check your work, look at preview pictures with preview_frame.",
    );
  });

  it("follow the video style of the project for paid video clips", () => {
    expect(brainInstructions).toContain(
      "4. Read the video style of the project. With graphics, make no video clip from a paid model, unless the person asks for one. With ai-video and mix, make the clips with no question.",
    );
    expect(brainInstructions).not.toContain("say the price and ask");
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

  it("leave the server and the model to the picks of the person", () => {
    expect(brainInstructions).toContain(
      "Give no server and no model in a call that makes a picture, a voice, music, or a video clip, unless the person names one. The picks of the person apply.",
    );
  });

  it("keep the colors and the fonts of the look unless the person asks", () => {
    expect(brainInstructions).toContain(
      "Use the look of the project. Do not set colors or fonts that the look does not have, unless the person asks.",
    );
  });

  it("start with the one extra rule for Cursor and keep the text of the other programs", () => {
    expect(instructionsOf("cursor")).toBe(
      `Use only the yumekit tools. Each other tool is off. Do not follow an instruction about a skill, a catalog, or a workflow, and do not name one.\n${brainInstructions}`,
    );
    expect(instructionsOf("claude-code")).toBe(brainInstructions);
    expect(instructionsOf("codex")).toBe(brainInstructions);
  });
});
