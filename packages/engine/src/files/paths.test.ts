import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTestProject,
  startedTestEngine,
  startTestEngine,
} from "../testing/engineFixture.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";

const secretText = "outside-secret-4f1c";

async function engineWithFiles(options?: { editorFolderName: string }) {
  const project = await createTestProject();
  const editorFolder = join(project.root, "editor");
  await mkdir(join(editorFolder, "assets"), { recursive: true });
  await writeFile(join(editorFolder, "index.html"), "<p>editor page</p>");
  await writeFile(join(editorFolder, "assets", "app.js"), "export {};");
  await writeFile(join(project.root, "secret.txt"), secretText);
  await mkdir(join(project.projectFolder, "renders"), { recursive: true });
  await writeFile(join(project.projectFolder, "renders", "wide.mp4"), "video");
  const engine = await startTestEngine({
    projectFolder: project.projectFolder,
    editorFolder: join(project.root, options?.editorFolderName ?? "editor"),
  });
  return { ...project, engine };
}

const traversals = [
  "..%2F..%2Fsecret.txt",
  "%2e%2e/%2e%2e/secret.txt",
  "%2E%2E%2F%2E%2E%2Fsecret.txt",
  "../../secret.txt",
  "..%5C..%5Csecret.txt",
];

describe("the file paths of the engine", () => {
  it("serves no file outside the renders folder for a traversal or an absolute path", async () => {
    const { engine, root } = await engineWithFiles();
    const paths = [
      ...traversals.map((path) => `/api/renders/${path}`),
      `/api/renders/${encodeURIComponent(join(root, "secret.txt"))}`,
      `/api/renders/${join(root, "secret.txt")}`,
    ];

    const answers = await Promise.all(
      paths.map((path) =>
        rawRequest({ port: engine.port, path, headers: withToken(engine) }),
      ),
    );
    const render = await rawRequest({
      port: engine.port,
      path: "/api/renders/wide.mp4",
      headers: withToken(engine),
    });

    expect(answers.map((answer) => answer.body.includes(secretText))).toEqual(
      paths.map(() => false),
    );
    expect(answers.map((answer) => answer.status >= 400)).toEqual(
      paths.map(() => true),
    );
    expect(render.status).toBe(200);
    expect(render.body).toBe("video");
    expect(render.headers["content-type"]).toBe("video/mp4");
  });

  it("serves no file outside the project for an asset path with a traversal", async () => {
    const { engine } = await engineWithFiles();
    const paths = [
      ...traversals.map((path) => `/api/assets/${path}/file`),
      "/api/assets/%2Fetc%2Fpasswd/file",
    ];

    const answers = await Promise.all(
      paths.map((path) =>
        rawRequest({ port: engine.port, path, headers: withToken(engine) }),
      ),
    );

    expect(answers.map((answer) => answer.body.includes(secretText))).toEqual(
      paths.map(() => false),
    );
    expect(answers.map((answer) => answer.status >= 400)).toEqual(
      paths.map(() => true),
    );
  });

  it("serves the editor files with no token, and no file outside the editor folder", async () => {
    const { engine: editorEngine, root } = await engineWithFiles();
    const paths = [
      ...traversals.map((path) => `/${path}`),
      ...traversals.map((path) => `/assets/${path}`),
      `/${encodeURIComponent(join(root, "secret.txt"))}`,
    ];

    const answers = await Promise.all(
      paths.map((path) => rawRequest({ port: editorEngine.port, path })),
    );
    const page = await rawRequest({
      port: editorEngine.port,
      path: `/?token=${editorEngine.token}`,
    });
    const script = await rawRequest({
      port: editorEngine.port,
      path: "/assets/app.js",
    });

    expect(answers.map((answer) => answer.body.includes(secretText))).toEqual(
      paths.map(() => false),
    );
    expect(answers.map((answer) => answer.status >= 400)).toEqual(
      paths.map(() => true),
    );
    expect(page.body).toBe("<p>editor page</p>");
    expect(page.headers["content-security-policy"]).toBe(
      "frame-ancestors 'none'",
    );
    expect(script.headers["content-type"]).toBe(
      "text/javascript; charset=utf-8",
    );
  });

  it("serves a page that says the editor is not built when the editor folder has no index.html", async () => {
    const { engine } = await engineWithFiles({ editorFolderName: "missing" });

    const page = await rawRequest({ port: engine.port, path: "/" });
    const other = await rawRequest({ port: engine.port, path: "/app.js" });

    expect(page.status).toBe(200);
    expect(page.body).toContain("The editor is not built");
    expect(other.status).toBe(404);
  });

  it("answers a non-api path with 404 when the engine has no editor folder", async () => {
    const { engine } = await startedTestEngine();

    const page = await rawRequest({ port: engine.port, path: "/" });

    expect(page.status).toBe(404);
  });
});
