import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";
import { startHarness } from "./harnessFixture.js";

const pricedServerCommand = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL(
        "../../../tools/src/testing/pricedMediaServer.ts",
        import.meta.url,
      ),
    ),
  ],
  passEnvironment: [
    "YUMEKIT_PRICED_KEY",
    "YUMEKIT_PRICED_CALLS",
    "YUMEKIT_PRICED_WAIT_MS",
    "YUMEKIT_PRICED_SPANS",
    "YUMEKIT_PRICED_QUOTA",
  ],
};

export async function startPricedHarness(options: {
  spendingUsd?: number;
  limits?: Record<string, number>;
  waitMilliseconds?: number;
  quotaUsedUp?: boolean;
}) {
  vi.stubEnv("YUMEKIT_PRICED_KEY", "made-up-priced-key");
  vi.stubEnv("YUMEKIT_PRICED_WAIT_MS", String(options.waitMilliseconds ?? 0));
  vi.stubEnv(
    "YUMEKIT_PRICED_QUOTA",
    options.quotaUsedUp === true ? "used-up" : "",
  );
  const harness = await startHarness({
    mediaToolsFile: {
      mcpServers: { sample: {}, priced: pricedServerCommand },
      defaults: { image: "priced", music: "priced", video: "priced" },
      limits: {
        ...options.limits,
        ...(options.spendingUsd === undefined
          ? {}
          : { spendingUsd: options.spendingUsd }),
      },
    },
  });
  const callsFile = join(harness.folder, "calls.txt");
  vi.stubEnv("YUMEKIT_PRICED_CALLS", callsFile);
  const spansFile = join(harness.folder, "spans.txt");
  vi.stubEnv("YUMEKIT_PRICED_SPANS", spansFile);
  return {
    harness,
    mostCallsAtOnce: async () =>
      mostAtOnce(await readFile(spansFile, "utf8").catch(() => "")),
    paidCallsOfServer: async () =>
      (await readFile(callsFile, "utf8").catch(() => ""))
        .split("\n")
        .filter((line) => line.startsWith("generate_")),
  };
}

function mostAtOnce(spansText: string): number {
  const events = spansText
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      const [startedAt = 0, endedAt = 0] = line.split(" ").map(Number);
      return [
        { at: startedAt, change: 1 },
        { at: endedAt, change: -1 },
      ];
    })
    .toSorted(
      (...[first, second]) =>
        first.at - second.at || first.change - second.change,
    );
  let running = 0;
  let most = 0;
  for (const event of events) {
    running += event.change;
    most = Math.max(most, running);
  }
  return most;
}

export function makeAsset(options: {
  harness: Awaited<ReturnType<typeof startHarness>>;
  assetId: string;
  capability: string;
  input?: Record<string, unknown>;
}) {
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: options.assetId,
      capability: options.capability,
      input: { prompt: `a lantern for ${options.assetId}`, ...options.input },
    },
  });
}
