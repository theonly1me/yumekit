import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checkCodex } from "./readiness.ts";

export const imageModel = "gpt-image-2";
export const serviceLabel = "Codex, with your ChatGPT plan";
export const maximumReferenceImages = 5;

const readOn = "2026-11-24";

export const codexImagesDescription = {
  label: serviceLabel,
  runs: "hosted",
  calls_at_once: 2,
  keys: [],
  models: [
    {
      id: imageModel,
      label: "GPT Image 2 in Codex",
      capability: "image",
      is_default: true,
      settings: [
        {
          name: "transparent_background",
          label: "Transparent background",
          kind: "switch",
          default: false,
        },
        {
          name: "reference_image_paths",
          label: "Reference images",
          kind: "image-files",
          maximum: maximumReferenceImages,
        },
      ],
      prices: [{ usd: 0, unit: "image", when: {} }],
      read_on: readOn,
      accepts: ["reference_images"],
      tested: true,
    },
  ],
};

export function registerCatalogTools(options: {
  server: McpServer;
  findProgram: () => Promise<string | undefined>;
  environment: NodeJS.ProcessEnv;
}): void {
  options.server.registerTool(
    "describe_media_server",
    {
      description:
        "Describe this server: pictures made by the Codex program of the person, with their ChatGPT plan and no key.",
      annotations: { readOnlyHint: true },
    },
    () => ({
      content: [{ type: "text", text: JSON.stringify(codexImagesDescription) }],
      structuredContent: { ...codexImagesDescription },
    }),
  );
  options.server.registerTool(
    "check_key",
    {
      description:
        "Check for free that Codex is installed, signed in with ChatGPT, and can make pictures. Makes no picture.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const checked = await checkCodex({
        programPath: await options.findProgram(),
        environment: options.environment,
      });
      const check = checked.ok
        ? { valid: true, message: "Codex is ready to make pictures." }
        : { valid: false, message: checked.failure };
      return {
        content: [{ type: "text", text: check.message }],
        structuredContent: check,
      };
    },
  );
}
