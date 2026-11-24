import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { vi } from "vitest";
import { ledgerFileOf, readLedger } from "../spending/ledger.js";
import {
  connectFixture,
  pricedServerCommand,
  sampleServerCommand,
} from "./mediaToolsFixture.js";

export async function pricedFixture(options: {
  spendingUsd?: number;
  key?: string;
}) {
  vi.stubEnv("YUMEKIT_PRICED_KEY", options.key ?? "made-up-priced-key");
  const fixture = await connectFixture({
    projectFile: {
      mcpServers: { priced: pricedServerCommand },
      ...(options.spendingUsd === undefined
        ? {}
        : { limits: { spendingUsd: options.spendingUsd } }),
    },
    bundledServers: { sample: sampleServerCommand },
  });
  const callsFile = join(fixture.projectFolder, "calls.txt");
  vi.stubEnv("YUMEKIT_PRICED_CALLS", callsFile);
  return {
    ...fixture,
    callsOfServer: async () =>
      (await readFile(callsFile, "utf8").catch(() => ""))
        .split("\n")
        .filter(Boolean),
    ledger: async () => {
      const read = await readLedger(ledgerFileOf(fixture.projectFolder));
      if (!read.ok) throw new Error(read.failure.message);
      return read.value;
    },
  };
}
