import { describe, expect, it } from "vitest";
import type { MediaToolProgress } from "./types.js";
import {
  connectFixture,
  downloadServerCommand,
} from "./testing/mediaToolsFixture.js";

async function downloadFixture() {
  const fixture = await connectFixture({
    projectFile: { mcpServers: { voice: downloadServerCommand } },
  });
  let changes = 0;
  fixture.tools.onDescriptionsChanged(() => {
    changes += 1;
  });
  const download = async () => {
    const choices = await fixture.tools.choices();
    const speech = choices.choices.find(
      (choice) => choice.capability === "speech",
    );
    const voice = speech?.services.find(
      (service) => service.server === "voice",
    );
    return voice?.models[0]?.download;
  };
  return { ...fixture, download, changes: () => changes };
}

describe("connectMediaTools with a model that downloads once", () => {
  it("gives the size of the download and its state in the choices", async () => {
    const fixture = await downloadFixture();

    expect(await fixture.download()).toEqual({
      bytes: 2_000_000,
      ready: false,
    });
  });

  it("prepares the model with progress, then gives it as ready and tells the listener", async () => {
    const fixture = await downloadFixture();
    const progress: MediaToolProgress[] = [];

    const prepared = await fixture.tools.prepare({
      server: "voice",
      onProgress: (step) => progress.push(step),
    });

    expect(prepared).toEqual({ ok: true, value: true });
    expect(progress).toEqual([
      {
        done: 2_000_000,
        total: 2_000_000,
        message: "Getting the test voice, one time, 2 MB",
      },
    ]);
    expect(await fixture.download()).toEqual({
      bytes: 2_000_000,
      ready: true,
    });
    expect(fixture.changes()).toBe(1);
  });

  it("gives the model as ready after the first voice call downloaded it", async () => {
    const fixture = await downloadFixture();

    const ran = await fixture.tools.run({
      capability: "speech",
      input: { text: "Hello" },
      outputDirectory: fixture.outputDirectory,
      fileStem: "hello",
    });

    expect(ran.ok).toBe(true);
    expect(await fixture.download()).toEqual({
      bytes: 2_000_000,
      ready: true,
    });
    expect(fixture.changes()).toBe(1);
  });

  it("says that a server with no download has nothing to prepare", async () => {
    const fixture = await downloadFixture();

    expect(await fixture.tools.prepare({ server: "sample" })).toEqual({
      ok: false,
      failure: { kind: "nothing-to-prepare", server: "sample" },
    });
  });
});
