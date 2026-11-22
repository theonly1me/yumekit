import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { startedTestEngine } from "../testing/engineFixture.js";
import {
  bodyOf,
  callTool,
  rawRequest,
  withToken,
} from "../testing/rawRequest.js";
import { uploadRequest, wavBytes } from "../testing/uploadRequest.js";

async function assetsOf(engine: { port: number; token: string }) {
  const project = await rawRequest({
    port: engine.port,
    path: "/api/project",
    headers: withToken(engine),
  });
  const snapshot = bodyOf(project);
  const assets: unknown =
    typeof snapshot === "object" && snapshot !== null
      ? Reflect.get(snapshot, "assets")
      : undefined;
  return Array.isArray(assets) ? assets.map((asset: unknown) => asset) : [];
}

function strayFilesAbove(folder: string): string[] {
  const parent = dirname(folder);
  const here = join(folder, "outside.wav");
  const found = existsSync(here) ? [here] : [];
  return parent === folder ? found : [...found, ...strayFilesAbove(parent)];
}

describe("the upload request", () => {
  it("adds the file as an asset under its original name, and a download gives the same bytes under that name", async () => {
    const { engine, projectFolder } = await startedTestEngine();
    const bytes = wavBytes(1);

    const uploaded = await uploadRequest({
      ...engine,
      name: "My Song.wav",
      body: bytes,
    });
    const downloaded = await rawRequest({
      port: engine.port,
      path: "/api/assets/mysong/file?download=1",
      headers: withToken(engine),
    });

    expect(uploaded.status).toBe(200);
    expect(bodyOf(uploaded)).toMatchObject({
      asset: {
        id: "mysong",
        kind: "audio",
        durationFrames: 30,
        source: { kind: "import", originalName: "My Song.wav" },
      },
    });
    expect(downloaded.bytes.equals(bytes)).toBe(true);
    expect(downloaded.headers["content-disposition"]).toBe(
      `attachment; filename="My_Song.wav"; filename*=UTF-8''My%20Song.wav`,
    );
    const stored = await readFile(
      join(projectFolder, "assets", "files", "mysong.wav"),
    );
    expect(stored.equals(bytes)).toBe(true);
  });

  it("is one undo step", async () => {
    const { engine } = await startedTestEngine();
    await uploadRequest({ ...engine, name: "voice.wav", body: wavBytes(1) });

    await callTool({ ...engine, name: "undo", input: {} });

    expect(await assetsOf(engine)).toEqual([]);
  });

  it.each([
    ["a name with ../", "../../../outside.wav"],
    ["an absolute path", "/tmp/elsewhere/outside.wav"],
    ["a Windows path", "..\\..\\outside.wav"],
  ])(
    "keeps only the last part of %s and writes nothing outside the project",
    async (...[, name]) => {
      const { engine, root, projectFolder } = await startedTestEngine();

      const uploaded = await uploadRequest({
        ...engine,
        name,
        body: wavBytes(1),
      });

      expect(bodyOf(uploaded)).toMatchObject({
        asset: { id: "outside", source: { originalName: "outside.wav" } },
      });
      expect(await readdir(root)).toEqual(["config", "project"]);
      expect(strayFilesAbove(tmpdir())).toEqual([]);
      expect(await readdir(join(projectFolder, "assets", "files"))).toEqual([
        "outside.wav",
      ]);
    },
  );

  it("refuses a name with no letters or digits", async () => {
    const { engine } = await startedTestEngine();

    const uploaded = await uploadRequest({
      ...engine,
      name: "../..",
      body: wavBytes(1),
    });

    expect(uploaded.status).toBe(400);
    expect(bodyOf(uploaded)).toMatchObject({ kind: "upload-name-not-valid" });
    expect(await assetsOf(engine)).toEqual([]);
  });

  it("needs the session token", async () => {
    const { engine } = await startedTestEngine();

    const uploaded = await uploadRequest({
      ...engine,
      token: undefined,
      name: "voice.wav",
      body: wavBytes(1),
    });

    expect(uploaded.status).toBe(401);
    expect(await assetsOf(engine)).toEqual([]);
  });

  it("gives the failure of import_asset for a file that is not media", async () => {
    const { engine } = await startedTestEngine();

    const uploaded = await uploadRequest({
      ...engine,
      name: "notes.txt",
      body: Buffer.from("plain words"),
    });

    expect(uploaded.status).toBe(400);
    expect(bodyOf(uploaded)).toMatchObject({ kind: "file-type-not-supported" });
    expect(await assetsOf(engine)).toEqual([]);
  });

  it("gives the failure of import_asset for a sound with the extension of a picture", async () => {
    const { engine } = await startedTestEngine();

    const uploaded = await uploadRequest({
      ...engine,
      name: "voice.png",
      body: wavBytes(1),
    });

    expect(bodyOf(uploaded)).toMatchObject({
      kind: "file-type-not-supported",
      message: 'A audio asset cannot have the extension ".png".',
    });
  });

  it("gives a new id when the name is in use", async () => {
    const { engine } = await startedTestEngine();
    await uploadRequest({ ...engine, name: "voice.wav", body: wavBytes(1) });

    const second = await uploadRequest({
      ...engine,
      name: "voice.wav",
      body: wavBytes(1),
    });

    expect(bodyOf(second)).toMatchObject({ asset: { id: "voice-2" } });
  });
});
