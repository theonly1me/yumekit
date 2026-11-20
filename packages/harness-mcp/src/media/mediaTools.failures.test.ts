import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";

describe("media tool failures", () => {
  it("names the connected servers when a server is unknown", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "voice",
        capability: "speech",
        server: "elevenlabs",
        input: { text: "hi" },
      },
    });

    expect(result.data["kind"]).toBe("server-not-found");
    expect(result.data["message"]).toContain("elevenlabs");
    expect(result.data["hint"]).toContain("list_media_tools");
  });

  it("says that no server makes video and what to do", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "clip",
        capability: "video",
        input: { prompt: "waves", duration_seconds: 2 },
      },
    });

    expect(result.data["kind"]).toBe("no-server-for-capability");
    expect(result.data["hint"]).toContain("media-tools.json");
  });

  it("passes the message of a failed media tool with a hint to correct the input", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: { asset_id: "voice", capability: "speech", input: {} },
    });

    expect(result.data["kind"]).toBe("media-tool-failed");
    expect(result.data["message"]).toContain("text");
    expect(result.data["hint"]).toContain("correct it and call again");
  });

  it("refuses an asset id in use before it calls the media tool", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "voice",
        capability: "speech",
        input: { text: "first" },
      },
    });

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "voice",
        capability: "speech",
        input: { text: "second take" },
      },
    });

    expect(result.data["kind"]).toBe("id-in-use");
    expect(result.data["hint"]).toContain("list_assets");
    expect(
      harness.store.read().assets.map((asset) => asset.durationFrames),
    ).toEqual([9]);
  });

  it("align_words on speech that has words points to get_asset_words", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "voice",
        capability: "speech",
        input: { text: "hi" },
      },
    });

    const result = await harness.call({
      name: "align_words",
      arguments: { asset_id: "voice", text: "hi" },
    });

    expect(result.data["kind"]).toBe("asset-has-words");
    expect(result.data["hint"]).toContain("get_asset_words");
  });

  it("get_asset_words of an asset without words points to align_words", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "tune",
        capability: "music",
        input: { prompt: "calm", duration_seconds: 1 },
      },
    });

    const result = await harness.call({
      name: "get_asset_words",
      arguments: { asset_id: "tune" },
    });

    expect(result.data["kind"]).toBe("asset-has-no-words");
    expect(result.data["hint"]).toContain('align_words with asset_id "tune"');
  });

  it("import_asset explains a missing file, a wrong extension, and audio that it cannot import", async () => {
    const harness = await startHarness();
    const importFile = (options: { kind: string; sourcePath: string }) =>
      harness.call({
        name: "import_asset",
        arguments: {
          asset_id: "logo",
          kind: options.kind,
          source_path: options.sourcePath,
        },
      });

    const missing = await importFile({
      kind: "image",
      sourcePath: join(harness.folder, "missing.png"),
    });
    const wrongType = await importFile({ kind: "image", sourcePath: "/a.mp3" });
    const audio = await importFile({ kind: "audio", sourcePath: "/a.wav" });

    expect(missing.data).toMatchObject({ kind: "source-not-found" });
    expect(wrongType.data).toMatchObject({ kind: "file-type-not-supported" });
    expect(wrongType.data["hint"]).toContain(".png");
    expect(audio.data).toMatchObject({ kind: "import-kind-not-supported" });
    expect(audio.data["hint"]).toContain("generate_asset");
  });
});
