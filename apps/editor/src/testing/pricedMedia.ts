import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { withoutOtherBundled } from "./mediaTestTools.js";
import type { RunningEngine } from "./runEngine.js";

export const pricedServer = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL(
        "../../../../packages/tools/src/testing/pricedMediaServer.ts",
        import.meta.url,
      ),
    ),
  ],
  passEnvironment: ["YUMEKIT_PRICED_KEY"],
};

export const pricedEngineOptions = {
  fakeAgent: true,
  environment: { YUMEKIT_PRICED_KEY: "made-up-priced-key" },
  mediaTools: {
    mcpServers: { priced: pricedServer, ...withoutOtherBundled },
    defaults: { video: "priced" },
    limits: { spendingUsd: 3 },
  },
};

const ownLimitsSchema = z.object({
  limits: z.object({ spendingUsd: z.number() }),
});

export async function moneyLimitOf(engine: RunningEngine): Promise<number> {
  const text = await readFile(
    join(engine.projectFolder, "media-tools.json"),
    "utf8",
  );
  return ownLimitsSchema.parse(JSON.parse(text)).limits.spendingUsd;
}
