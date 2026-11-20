import { readdir } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectFixture,
  fakeServerCommand,
  missingServerCommand,
} from "./testing/mediaToolsFixture.js";

const imageInput = { prompt: "a red fox", width_pixels: 32, height_pixels: 32 };

describe("connectMediaTools failures", () => {
  it("returns media-tool-invalid-result with the server name when a result has the wrong shape", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: { mcpServers: { fake: fakeServerCommand } },
    });

    const outcome = await tools.run({
      capability: "image",
      server: "fake",
      input: imageInput,
      outputDirectory,
      fileStem: "fox",
    });

    if (outcome.ok) throw new Error("Expected a failure");
    expect(outcome.failure).toMatchObject({
      kind: "media-tool-invalid-result",
      server: "fake",
    });
    expect("message" in outcome.failure && outcome.failure.message).toMatch(
      /path must be absolute[\s\S]*kind/,
    );
  });

  it("returns server-failed-to-start for a missing command and still runs the other servers", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: { missing: missingServerCommand, sample: {} },
      },
    });

    const missing = await tools.run({
      capability: "image",
      server: "missing",
      input: imageInput,
      outputDirectory,
      fileStem: "fox",
    });
    const sample = await tools.run({
      capability: "image",
      input: imageInput,
      outputDirectory,
      fileStem: "fox",
    });

    if (missing.ok) throw new Error("Expected a failure");
    expect(missing.failure).toMatchObject({
      kind: "server-failed-to-start",
      server: "missing",
    });
    expect("message" in missing.failure && missing.failure.message).toMatch(
      /ENOENT/,
    );
    expect(tools.list().map((entry) => entry.server)).toEqual(["sample"]);
    expect(sample.ok).toBe(true);
  });

  it("returns server-not-found for a server name that no file defines", async () => {
    const { tools, outputDirectory } = await connectFixture({});

    const outcome = await tools.run({
      capability: "image",
      server: "openai",
      input: imageInput,
      outputDirectory,
      fileStem: "fox",
    });

    expect(outcome).toEqual({
      ok: false,
      failure: { kind: "server-not-found", server: "openai" },
    });
  });

  it("returns no-server-for-capability when no server lists the tool", async () => {
    const { tools, outputDirectory } = await connectFixture({});

    const anyServer = await tools.run({
      capability: "video",
      input: { prompt: "waves", duration_seconds: 2 },
      outputDirectory,
      fileStem: "waves",
    });
    const namedServer = await tools.run({
      capability: "video",
      server: "sample",
      input: { prompt: "waves", duration_seconds: 2 },
      outputDirectory,
      fileStem: "waves",
    });

    expect(anyServer).toEqual({
      ok: false,
      failure: { kind: "no-server-for-capability", capability: "video" },
    });
    expect(namedServer).toEqual({
      ok: false,
      failure: {
        kind: "no-server-for-capability",
        capability: "video",
        server: "sample",
      },
    });
  });

  it("returns media-tool-failed with the server message and writes nothing outside the output directory", async () => {
    const { tools, outputDirectory } = await connectFixture({});

    const outcome = await tools.run({
      capability: "image",
      input: imageInput,
      outputDirectory,
      fileStem: "../escape",
    });

    expect(outcome).toEqual({
      ok: false,
      failure: {
        kind: "media-tool-failed",
        server: "sample",
        message: 'file_stem "../escape" must be a plain file name with no path',
      },
    });
    expect(await readdir(dirname(outputDirectory))).toEqual([]);
  });
});
