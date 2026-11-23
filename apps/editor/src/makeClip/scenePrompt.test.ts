import { describe, expect, it } from "vitest";
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
});
