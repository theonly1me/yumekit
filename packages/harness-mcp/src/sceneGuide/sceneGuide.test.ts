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
