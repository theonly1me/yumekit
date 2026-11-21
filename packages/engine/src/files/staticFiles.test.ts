import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTestProject,
  startTestEngine,
} from "../testing/engineFixture.js";
import { rawRequest } from "../testing/rawRequest.js";

async function engineWithEditor(editorFolderName: string) {
  const project = await createTestProject();
  const editorFolder = join(project.root, "editor");
  await mkdir(join(editorFolder, "assets"), { recursive: true });
  await writeFile(join(editorFolder, "index.html"), "<p>editor page</p>");
  await writeFile(join(editorFolder, "assets", "app.js"), "export {};");
  return startTestEngine({
    projectFolder: project.projectFolder,
    editorFolder: join(project.root, editorFolderName),
  });
}

const paths = (token: string) => [
  "/",
  `/?token=${token}`,
  "/index.html",
  `/index.html?token=${token}`,
  "/assets/app.js",
  `/assets/app.js?token=${token}`,
  "/missing.js",
  `/missing.js?token=${token}`,
];

describe("the static files of the engine", () => {
  for (const editorFolderName of ["editor", "not-built"]) {
    it(`never hold the token in a body or a header (${editorFolderName})`, async () => {
      const engine = await engineWithEditor(editorFolderName);

      const answers = await Promise.all(
        paths(engine.token).map((path) =>
          rawRequest({ port: engine.port, path }),
        ),
      );

      expect(answers[0]?.status).toBe(200);
      expect(
        answers.filter(
          (answer) =>
            answer.body.includes(engine.token) ||
            JSON.stringify(answer.headers).includes(engine.token),
        ),
      ).toEqual([]);
    });
  }
});
