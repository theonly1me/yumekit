import { z } from "zod";
import { seedance25 } from "../catalog/video/seedance.ts";
import {
  authorization,
  falUrls,
  missingKeyMessage,
  requestJson,
} from "../falApi.ts";
import { withoutKey, type ToolOptions } from "../toolOptions.ts";
import { errorResult, structuredResult } from "../toolResults.ts";

const rejectedKeyStatuses = [401, 403];

const pricingBody = z.object({ prices: z.array(z.unknown()) });

function pricingUrl(): string {
  const url = new URL(`${falUrls.platform}/models/pricing`);
  url.searchParams.append("endpoint_id", seedance25.textEndpointId);
  return url.toString();
}

export function registerCheckKeyTool(options: ToolOptions): void {
  options.server.registerTool(
    "check_key",
    {
      description:
        "Check FAL_KEY with one request to the fal price list. The request runs no model and makes no video.",
    },
    async () => {
      const { apiKey } = options;
      if (!apiKey) {
        return structuredResult({ valid: false, message: missingKeyMessage });
      }
      const checked = await requestJson({
        sendRequest: options.sendRequest,
        schema: pricingBody,
        request: new Request(pricingUrl(), { headers: authorization(apiKey) }),
      });
      if (checked.ok) {
        return structuredResult({
          valid: true,
          message: "fal accepted the key in FAL_KEY.",
        });
      }
      const message = withoutKey({ message: checked.failure.message, apiKey });
      const { status } = checked.failure;
      if (status !== undefined && rejectedKeyStatuses.includes(status)) {
        return structuredResult({
          valid: false,
          message: `fal rejected the key in FAL_KEY. Create a new key at the keys page of the fal dashboard and set FAL_KEY again. ${message}`,
        });
      }
      return errorResult(`Cannot check FAL_KEY. ${message}`);
    },
  );
}
