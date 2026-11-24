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
  passEnvironment: ["YUMEKIT_PRICED_KEY", "YUMEKIT_PRICED_CALLS"],
};

export async function startPricedHarness(options: { spendingUsd?: number }) {
  vi.stubEnv("YUMEKIT_PRICED_KEY", "made-up-priced-key");
  const harness = await startHarness({
    mediaToolsFile: {
      mcpServers: { sample: {}, priced: pricedServerCommand },
      defaults: { image: "priced", music: "priced", video: "priced" },
      ...(options.spendingUsd === undefined
        ? {}
        : { limits: { spendingUsd: options.spendingUsd } }),
    },
  });
  const callsFile = join(harness.folder, "calls.txt");
  vi.stubEnv("YUMEKIT_PRICED_CALLS", callsFile);
  return {
    harness,
    paidCallsOfServer: async () =>
      (await readFile(callsFile, "utf8").catch(() => ""))
        .split("\n")
        .filter((line) => line.startsWith("generate_")),
  };
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
