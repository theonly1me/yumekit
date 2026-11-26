import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import {
  connectFixture,
  planServerCommand,
  pricedServerCommand,
  sampleServerCommand,
} from "./testing/mediaToolsFixture.js";

async function planFixture(options: {
  planState: "ready" | "signed-out" | "usage-limit";
  spendingUsd?: number;
  picked?: string;
}) {
  const callsFolder = await mkdtemp(join(tmpdir(), "yumekit-plan-"));
  onTestFinished(() => rm(callsFolder, { recursive: true, force: true }));
  const callsFile = join(callsFolder, "c");
  vi.stubEnv("YUMEKIT_PLAN_STATE", options.planState);
  vi.stubEnv("YUMEKIT_PRICED_KEY", "made-up-priced-key");
  vi.stubEnv("YUMEKIT_PRICED_CALLS", callsFile);
  const fixture = await connectFixture({
    projectFile: {
      mcpServers: { priced: pricedServerCommand, codex: planServerCommand },
      ...(options.picked === undefined
        ? {}
        : { defaults: { image: options.picked } }),
      ...(options.spendingUsd === undefined
        ? {}
        : { limits: { spendingUsd: options.spendingUsd } }),
    },
    bundledServers: { sample: sampleServerCommand },
  });
  const picture = () =>
    fixture.tools.run({
      capability: "image",
      input: { prompt: "a lantern" },
      outputDirectory: fixture.outputDirectory,
      fileStem: "lantern",
    });
  const calls = async () =>
    (await readFile(callsFile, "utf8").catch(() => ""))
      .split("\n")
      .filter((line) => line.endsWith("generate_image"));
  return { ...fixture, picture, calls };
}

describe("a service that uses the plan of the person", () => {
  it("comes before a service with a key in the order with no pick, and spends nothing", async () => {
    const { picture, tools } = await planFixture({ planState: "ready" });

    const made = await picture();

    expect(made.ok && made.value.server).toBe("codex");
    expect(made.ok && made.value.cost).toBeUndefined();
    const spending = await tools.spending();
    expect(spending.ok && spending.value.paidCalls).toBe(0);
  });

  it("is skipped while it is not ready, and the picker shows the reason", async () => {
    const { picture, tools, calls } = await planFixture({
      planState: "signed-out",
    });

    const made = await picture();
    const image = (await tools.choices()).choices.find(
      (choice) => choice.capability === "image",
    );

    expect(made.ok && made.value.server).toBe("priced");
    expect(await calls()).toEqual(["generate_image"]);
    expect(
      image?.services.find((service) => service.server === "codex"),
    ).toMatchObject({
      state: "not-ready",
      keyProblem:
        "Codex is not signed in. Open a terminal and run: codex login.",
    });
  });

  it("fails a picked service that is not ready with its reason and makes no call", async () => {
    const { picture, calls } = await planFixture({
      planState: "signed-out",
      picked: "codex",
    });

    const made = await picture();

    expect(made.ok ? made.value.server : made.failure).toEqual({
      kind: "media-service-not-ready",
      server: "codex",
      message: "Codex is not signed in. Open a terminal and run: codex login.",
    });
    expect(await calls()).toEqual([]);
  });

  it("goes to the next service after a usage limit when the spending limit permits paid calls", async () => {
    const { picture, calls } = await planFixture({ planState: "usage-limit" });

    const made = await picture();

    expect(made.ok && made.value.server).toBe("priced");
    expect(await calls()).toEqual(["plan generate_image", "generate_image"]);
  });

  it("returns the usage limit and makes no paid call when the spending limit is 0", async () => {
    const { picture, calls } = await planFixture({
      planState: "usage-limit",
      spendingUsd: 0,
    });

    const made = await picture();

    expect(made.ok ? made.value.server : made.failure).toEqual({
      kind: "media-usage-limit-reached",
      server: "codex",
      message: "You’ve hit your usage limit.",
    });
    expect(await calls()).toEqual(["plan generate_image"]);
  });

  it("keeps a picked service: a usage limit fails with its kind and tries no other service", async () => {
    const { picture, calls } = await planFixture({
      planState: "usage-limit",
      picked: "codex",
    });

    const made = await picture();

    expect(made.ok ? made.value.server : made.failure.kind).toBe(
      "media-usage-limit-reached",
    );
    expect(await calls()).toEqual(["plan generate_image"]);
  });
});
