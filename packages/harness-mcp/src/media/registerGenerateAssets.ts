import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { togetherResult } from "../work/together/togetherResult.js";
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

export const generateAssetsDescription = `Run several generate_asset calls at the same time and wait for all of them, for example the start pictures of all free shots, or their clips. Each call has the fields of generate_asset and keeps all its rules: the plan check, the tries, the reviews first, and the limits. A media service runs at most 3 calls at once (2 for Codex), and the rest wait for a free place. Each call answers on its own: one that fails does not stop the others. After a service-quota failure, the calls that still wait for that service are not sent. One shot or one sheet makes one try at a time. Give each call another shot, sheet, or sound.`;

export function registerGenerateAssets(context: HarnessContext): void {
  context.tools.add({
    name: "generate_assets",
    description: generateAssetsDescription,
    inputSchema: generateAssetsInput,
    run: async ({ input, onProgress }) => {
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
