import { findCameraMove } from "@yumekit/project/camera-moves";
import { describe, expect, it } from "vitest";
import { promptWithCameraMove } from "./cameraSentence.js";
import { promptOfScene } from "./scenePrompt.js";

function sceneWith(options: { title: string; props: Record<string, string> }) {
  return {
    id: "scene-one",
    title: options.title,
    notes: "",
    source: {
      kind: "kit" as const,
      component: "title-card",
      props: options.props,
    },
  };
}

describe("the prompt that the clip sheet writes from a scene", () => {
  it("starts from the title, keeps the texts in their order, and says no word twice", () => {
    const scene = sceneWith({
      title: "Product",
      props: {
        kicker: "Meet",
        heading: "Hoshi, calm green tea",
        accent: "Hoshi",
      },
    });

    expect(promptOfScene({ scene, assets: [] })).toBe(
      "Product. Meet. Hoshi, calm green tea. Natural light.",
    );
  });

  it("drops a word that an earlier text of the scene already said", () => {
    const scene = sceneWith({
      title: "Calm focus",
      props: { heading: "No jitters", line: "Calm focus all day" },
    });

    expect(promptOfScene({ scene, assets: [] })).toBe(
      "No jitters. Calm focus all day. Natural light.",
    );
  });

  it("shows the prompt of the earlier clip without the sentence of its camera move, which the sheet adds again", () => {
    const sent = promptWithCameraMove({
      prompt: "A fox runs.",
      cameraMoveId: "orbit",
    });
    const scene = sceneWith({ title: "Fox", props: { assetId: "clip" } });
    const clip = {
      id: "clip",
      kind: "video" as const,
      hasWords: false,
      source: {
        kind: "tool" as const,
        tool: "generate_video",
        input: { prompt: sent, camera_move: "orbit" },
      },
    };

    expect(sent).toBe(
      `A fox runs.\n\n${findCameraMove("orbit")?.sentence ?? ""}`,
    );
    expect(promptOfScene({ scene, assets: [clip] })).toBe("A fox runs.");
  });
});
