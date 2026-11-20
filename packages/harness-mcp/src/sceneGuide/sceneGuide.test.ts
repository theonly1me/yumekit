import { checkSceneCode } from "@yumekit/render";
import { describe, expect, it } from "vitest";
import { sceneGuide, sceneGuideExamples } from "./index.js";

describe("scene guide", () => {
  it.each(sceneGuideExamples)(
    "the example '$title' compiles with checkSceneCode",
    async (example) => {
      const checked = await checkSceneCode({
        sceneId: "example",
        code: example.code,
      });

      expect(checked).toEqual({ ok: true, value: { checked: true } });
    },
  );

  it("tells agents to take colors and fonts from paper and to keep text out of the caption area", () => {
    expect(sceneGuide).toContain('import { paper } from "@yumekit/scene-kit";');
    expect(sceneGuide).toContain(
      "The bottom 16 units of the picture are the caption area.",
    );
    for (const example of sceneGuideExamples) {
      expect(example.code).toContain("paper.colors.background");
      expect(example.code).toContain("paddingBottom: 24 * unit");
    }
  });

  it("describes VideoFrame and framePictures, and the rejected <video> element", async () => {
    expect(sceneGuide).toContain(
      '<VideoFrame assetId={id} assetFrame={n} fit?={"cover" | "contain"} focus?={{ x, y }} />',
    );
    expect(sceneGuide).toContain(
      "framePictures?: { urlPrefix: string; count: number }",
    );
    expect(sceneGuide).toContain(
      "an assetFrame at or past `framePictures.count` shows the last frame",
    );
    expect(sceneGuide).toContain("A `<video>` element (put_scene rejects it");
    const checked = await checkSceneCode({
      sceneId: "film",
      code: 'import { defineReactScene } from "@yumekit/scene";\nexport default defineReactScene(() => <video src="/a.mp4" />);\n',
    });
    expect(checked.ok ? "" : checked.failure.kind).toBe("scene-compile-failed");
  });

  it("contains the code of each example", () => {
    for (const example of sceneGuideExamples) {
      expect(sceneGuide).toContain(example.code.trimEnd());
    }
  });

  it("uses no em dash and no en dash", () => {
    const dashes = [0x2013, 0x2014].map((codePoint) =>
      String.fromCodePoint(codePoint),
    );
    for (const dash of dashes) {
      expect(sceneGuide.includes(dash)).toBe(false);
    }
  });
});
