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

  it("give the colors and the font of the person to the kit scenes, and set no others", () => {
    expect(brainInstructions).toContain(
      "When the person gives colors or a font, give the colors to set_look and the font to set_fonts with look_font, so each kit scene draws in them. Set no other colors or fonts.",
    );
  });

  it("look at each file with one preview_assets call before it goes in the video", () => {
    expect(brainInstructions).toContain(
      "31. Look at a file before you place it: one preview_assets call shows each video and picture of the project",
    );
  });

  it("add each recurring person, place, and product to the cast before the first picture", () => {
    expect(brainInstructions).toContain(
      "15. Before the first picture, add each person, place, and product that shows in two or more scenes to the cast. Give the cast ids in each call that shows them.",
    );
  });

  it("prefer a kit scene, check each scene during its entry and settled, and set the transitions once", () => {
    expect(brainInstructions).toContain(
      "Before the first scene, call get_scene_guide.",
    );
    expect(brainInstructions).toContain(
      "12. Prefer a kit scene. Write scene code only when no kit scene can show the idea, and then follow the part Motion design of the scene guide.",
    );
    expect(brainInstructions).toContain(
      "13. Check each new scene with preview_scenes twice: with frame 10 for its entry, and with no frame for its settled picture.",
    );
    expect(brainInstructions).toContain(
      "14. Set how the scenes change with one call of set_transitions for the whole video.",
    );
  });

  it("check the whole video with one contact sheet after each build of the timeline", () => {
    expect(brainInstructions).toContain(
      "25. After each build or change of the timeline, look at the whole video with one call of contact_sheet. Correct each warning that it lists.",
    );
  });

  it("never use the test service for a voice or music, cover the whole video with one voice, and say how to sound out a name", () => {
    expect(brainInstructions).toContain(
      "16. Never use the free test service for a voice or for music in a video. With no other voice ready, use the natural voice of this computer. With no other music ready, use the music of this computer.",
    );
    expect(brainInstructions).toContain(
      "17. Make one voice that covers the whole video, with one line of the script for each scene, word for word.",
    );
    expect(brainInstructions).toContain(
      "18. When a video has a voice with captions, the text of a scene supports the voice. It does not show a second sentence at the same time.",
    );
    expect(brainInstructions).toContain(
      '19. If the voice does not know a name, give how it sounds in common English words in input.pronunciations of generate_asset or in pronunciations of replace_narration, for example {"Hoshi": "hoe she"}. Keep the name in the text.',
    );
    expect(brainInstructions).toContain(
      "15. Before the first picture, add each person",
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
