import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import { togetherResult } from "../work/together/togetherResult.js";
import { batchMoneyFailureOf } from "./batchMoney.js";
import {
  generateAssetInput,
  type GenerateAssetInput,
} from "./generateAssetInput.js";
import { generateAsset } from "./registerGenerateAsset.js";

export const mostCallsTogether = 8;

const generateAssetsInput = {
  calls: z
    .array(z.object(generateAssetInput))
    .min(1)
    .max(mostCallsTogether)
    .describe(
      `1 to ${String(mostCallsTogether)} generate_asset calls, each with the same fields as generate_asset. They run at the same time. Each one keeps every rule of generate_asset.`,
    ),
};

export const generateAssetsDescription = `Run several generate_asset calls at the same time and wait for all of them, for example the start pictures of all free shots, or their clips. Each call has the fields of generate_asset and keeps all its rules: the design check of the pictures of a clip, and the limits. Before the first call, yumekit adds the price of all calls: a batch that costs more than the money left of the project fails whole with over-money-left, and no call runs. Make each batch of a film in one call: all sheets, then all start pictures, then all clips. A media service runs at most 3 calls at once (2 for Codex), and the rest wait for a free place. Each call answers on its own: one that fails does not stop the others. After a service-quota failure, the calls that still wait for that service are not sent. One shot or one sheet makes one try at a time. Give each call another shot, sheet, or sound.`;

export function registerGenerateAssets(context: HarnessContext): void {
  context.tools.add({
    name: "generate_assets",
    description: generateAssetsDescription,
    inputSchema: generateAssetsInput,
    run: async ({ input, onProgress }) => {
      const overMoney = await batchMoneyFailureOf({
        context,
        calls: input.calls,
      });
      if (overMoney !== undefined) return failureResult(overMoney);
      let doneCount = 0;
      const quotaServers = new Set<string>();
      const total = input.calls.length;
      const results = await Promise.all(
        input.calls.map(async (request: GenerateAssetInput) => {
          const result = await generateAsset({
            context,
            request,
            onProgress: undefined,
            quotaServers,
          });
          doneCount += 1;
          onProgress?.({
            done: doneCount,
            total,
            message: `${String(doneCount)} of ${String(total)} made`,
          });
          return { id: request.asset_id, result };
        }),
      );
      return togetherResult({ results, what: "calls" });
    },
  });
}
