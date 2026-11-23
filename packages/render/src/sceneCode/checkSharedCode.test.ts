import { describe, expect, it } from "vitest";
import { checkSceneCode, checkSharedCode } from "../index.js";

const themeCode = 'export const accent: string = "#ff3366";\n';

const sceneUsingTheme = `import { defineReactScene } from "@yumekit/scene";
import { accent } from "./_shared/theme";

export default defineReactScene(() => <div style={{ color: accent }}>Hi</div>);
`;

describe("checkSceneCode and checkSharedCode with shared code", () => {
  it("accepts a scene that imports shared code as ./_shared/<name>", async () => {
    await expect(
      checkSceneCode({
        sceneId: "intro",
        code: sceneUsingTheme,
        sharedCode: { theme: themeCode },
      }),
    ).resolves.toEqual({ ok: true, value: { checked: true } });
  });

  it("refuses an import of shared code that the project does not have, and names put_shared_code", async () => {
    const result = await checkSceneCode({
      sceneId: "intro",
      code: sceneUsingTheme,
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        kind: "scene-import-not-permitted",
        importName: "./_shared/theme",
      },
    });
    expect(result.ok ? "" : result.failure.message).toContain(
      "put_shared_code",
    );
  });

  it("reports a type error in a scene that uses a shared value in the wrong way", async () => {
    const result = await checkSceneCode({
      sceneId: "intro",
      code: sceneUsingTheme.replace("color: accent", "color: accent.size"),
      sharedCode: { theme: themeCode },
    });

    expect(result).toMatchObject({
      ok: false,
      failure: { kind: "scene-compile-failed", sceneId: "intro", line: 4 },
    });
  });

  it("accepts shared code that imports other shared code as ./<name> and the kit", async () => {
    const code = [
      'import { enter } from "@yumekit/scene-kit/motion";',
      'import { accent } from "./theme";',
      "export const titleStyle = { color: accent, ...enter({ frame: 0, framesPerSecond: 30 }) };",
    ].join("\n");

    await expect(
      checkSharedCode({
        name: "title",
        code,
        sharedCode: { theme: themeCode },
      }),
    ).resolves.toEqual({ ok: true, value: { checked: true } });
  });

  it("refuses shared code that imports a package that a scene may not import", async () => {
    const result = await checkSharedCode({
      name: "files",
      code: 'import { readFile } from "node:fs/promises";\nexport const read = readFile;\n',
      sharedCode: {},
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        kind: "scene-import-not-permitted",
        sceneId: "_shared/files",
        importName: "node:fs/promises",
      },
    });
    expect(result.ok ? "" : result.failure.message).toContain(
      'shared code "files"',
    );
  });

  it("reports a type error inside shared code at its own line", async () => {
    const result = await checkSharedCode({
      name: "theme",
      code: 'export const accent: number = "#ff3366";\n',
      sharedCode: {},
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        kind: "scene-compile-failed",
        sceneId: "_shared/theme",
        line: 1,
      },
    });
  });
});
