import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startedTestEngine } from "../testing/engineFixture.js";
import {
  bodyOf,
  callTool,
  rawRequest,
  withToken,
  type RawResponse,
} from "../testing/rawRequest.js";

async function engineWithAudioAsset() {
  const started = await startedTestEngine();
  const generated = await callTool({
    ...started.engine,
    name: "generate_asset",
    input: {
      asset_id: "line-one",
      capability: "speech",
      server: "sample",
      input: { text: "one two three" },
    },
  });
  expect(bodyOf(generated)).toMatchObject({ isError: false });
  const project = await rawRequest({
    port: started.engine.port,
    path: "/api/project",
    headers: withToken(started.engine),
  });
  const snapshot = bodyOf(project);
  expect(snapshot).toMatchObject({ assets: [{ id: "line-one" }] });
  const file = /assets\/files\/[^"]+/.exec(JSON.stringify(snapshot))?.[0] ?? "";
  const bytes = await readFile(join(started.projectFolder, file));
  return { ...started, bytes };
}

function bytesOf(options: {
  port: number;
  token: string;
  range?: string;
}): Promise<RawResponse> {
  return rawRequest({
    port: options.port,
    path: "/api/assets/line-one/file",
    headers: withToken({
      token: options.token,
      headers: options.range === undefined ? {} : { range: options.range },
    }),
  });
}

describe("the asset file request", () => {
  it("serves the whole file with its type and Accept-Ranges", async () => {
    const { engine, bytes } = await engineWithAudioAsset();

    const whole = await bytesOf(engine);

    expect(whole.status).toBe(200);
    expect(whole.headers["content-type"]).toBe("audio/wav");
    expect(whole.headers["accept-ranges"]).toBe("bytes");
    expect(whole.bytes.equals(bytes)).toBe(true);
  });

  it("serves a range request with status 206 and the bytes of that range", async () => {
    const { engine, bytes } = await engineWithAudioAsset();

    const first = await bytesOf({ ...engine, range: "bytes=0-99" });
    const middle = await bytesOf({ ...engine, range: "bytes=40-" });
    const last = await bytesOf({ ...engine, range: "bytes=-16" });

    expect(first.status).toBe(206);
    expect(first.headers["content-range"]).toBe(
      `bytes 0-99/${String(bytes.length)}`,
    );
    expect(first.bytes.equals(bytes.subarray(0, 100))).toBe(true);
    expect(middle.headers["content-range"]).toBe(
      `bytes 40-${String(bytes.length - 1)}/${String(bytes.length)}`,
    );
    expect(middle.bytes.equals(bytes.subarray(40))).toBe(true);
    expect(last.headers["content-range"]).toBe(
      `bytes ${String(bytes.length - 16)}-${String(bytes.length - 1)}/${String(bytes.length)}`,
    );
    expect(last.bytes.equals(bytes.subarray(-16))).toBe(true);
  });

  it("answers a range past the end with 416", async () => {
    const { engine, bytes } = await engineWithAudioAsset();

    const past = await bytesOf({
      ...engine,
      range: `bytes=${String(bytes.length)}-`,
    });

    expect(past.status).toBe(416);
    expect(past.headers["content-range"]).toBe(
      `bytes */${String(bytes.length)}`,
    );
  });

  it("answers an asset id that the project does not have with 404", async () => {
    const { engine } = await startedTestEngine();

    const missing = await rawRequest({
      port: engine.port,
      path: "/api/assets/nothing/file",
      headers: withToken(engine),
    });

    expect(missing.status).toBe(404);
  });
});

describe("the render file request", () => {
  it("serves the cut of a chapter from the chapters folder of the renders", async () => {
    const { engine, projectFolder } = await startedTestEngine();
    const folder = join(projectFolder, "renders", "chapters");
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, "film-wide.mp4"), "the cut of the film");

    const cut = await rawRequest({
      port: engine.port,
      path: "/api/renders/chapters/film-wide.mp4",
      headers: withToken(engine),
    });

    expect(cut.status).toBe(200);
    expect(cut.bytes.toString()).toBe("the cut of the film");
  });
});
