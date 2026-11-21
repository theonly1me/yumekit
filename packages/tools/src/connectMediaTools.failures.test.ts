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

    if (missing.ok || missing.failure.kind !== "server-failed-to-start") {
      throw new Error("Expected server-failed-to-start");
    }
    expect(missing.failure.server).toBe("missing");
    expect(missing.failure.message).toMatch(/ENOENT/);
    expect(tools.list().map((entry) => entry.server)).toEqual(["sample"]);
    expect(tools.failedServers()).toEqual([
      { server: "missing", message: missing.failure.message },
    ]);
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
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: { fake: fakeServerCommand, sample: { disabled: true } },
      },
    });
    const alignRequest = {
      capability: "align",
      input: { audio_path: "/tmp/voice.wav", text: "hi" },
      outputDirectory,
      fileStem: "voice",
    } as const;

    const anyServer = await tools.run(alignRequest);
    const namedServer = await tools.run({ ...alignRequest, server: "fake" });

    expect(anyServer).toEqual({
      ok: false,
      failure: { kind: "no-server-for-capability", capability: "align" },
    });
    expect(namedServer).toEqual({
      ok: false,
      failure: {
        kind: "no-server-for-capability",
        capability: "align",
        server: "fake",
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
