import { describe, expect, it } from "vitest";
import { checkSceneCode } from "../index.js";
import {
  movingSquareCode,
  notPermittedImportCode,
  syntaxErrorCode,
} from "../testing/sceneCodes.js";

describe("checkSceneCode", () => {
  it("accepts a React scene that reads a prop as props.color", async () => {
    await expect(
      checkSceneCode({ sceneId: "square", code: movingSquareCode }),
    ).resolves.toEqual({ ok: true, value: { checked: true } });
  });

  it("rejects an import that document 02 does not permit", async () => {
    await expect(
      checkSceneCode({ sceneId: "files", code: notPermittedImportCode }),
    ).resolves.toMatchObject({
      ok: false,
      failure: {
        kind: "scene-import-not-permitted",
        sceneId: "files",
        importName: "node:fs/promises",
      },
    });
  });

  it.each([
    {
      name: "a dynamic import",
      line: 'void import("https://example.com/x.js");',
      importName: "https://example.com/x.js",
    },
    {
      name: "a relative import",
      line: 'export { other } from "./other.js";',
      importName: "./other.js",
    },
    {
      name: "a package that is not permitted",
      line: 'import "react-dom/client";',
      importName: "react-dom/client",
    },
  ])("rejects $name", async ({ line, importName }) => {
    const result = await checkSceneCode({
      sceneId: "intro",
      code: `${line}\n${movingSquareCode}`,
    });
    expect(result).toMatchObject({
      ok: false,
      failure: { kind: "scene-import-not-permitted", importName },
    });
  });

  it("reports the line and column of a syntax error", async () => {
    await expect(
      checkSceneCode({ sceneId: "broken", code: syntaxErrorCode }),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "scene-compile-failed", sceneId: "broken", line: 4 },
    });
  });

  it("reports a strict type error with its position", async () => {
    const code = movingSquareCode.replace(
      "const frame = useFrame();",
      "const frame: string = useFrame();",
    );
    await expect(
      checkSceneCode({ sceneId: "typed", code }),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "scene-compile-failed", line: 4, column: 9 },
    });
  });

  it("rejects a default export that is not a SceneModule", async () => {
    const result = await checkSceneCode({
      sceneId: "plain",
      code: "export default 42;\n",
    });
    expect(result).toMatchObject({
      ok: false,
      failure: { kind: "scene-compile-failed", line: 1, column: 1 },
    });
    expect(result.ok ? "" : result.failure.message).toContain("SceneModule");
  });
});
