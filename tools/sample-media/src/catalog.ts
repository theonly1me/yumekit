import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { free, newKindModels, readOn } from "./newKindModels.ts";

type Capability =
  | "image"
  | "speech"
  | "align"
  | "music"
  | "video"
  | "sound-effect"
  | "talking-clip"
  | "sharper";

const sidePixels = (setting: { name: string; label: string }) => ({
  ...setting,
  kind: "whole-number",
  minimum: 1,
  maximum: 4096,
  default: 1024,
});

export const sampleDescription = {
  label: "Sample (free test server)",
  runs: "on-this-computer",
  keys: [],
  models: [
    {
      id: "sample-image",
      label: "Prompt as text on a plain color",
      capability: "image",
      is_default: true,
      settings: [
        sidePixels({ name: "width_pixels", label: "Width in pixels" }),
        sidePixels({ name: "height_pixels", label: "Height in pixels" }),
        {
          name: "transparent_background",
          label: "Transparent background",
          kind: "switch",
          default: false,
        },
      ],
      prices: free("image"),
      read_on: readOn,
      accepts: ["reference_images"],
      tested: true,
    },
    {
      id: "sample-speech",
      label: "Quiet tone with even word timings",
      capability: "speech",
      is_default: true,
      settings: [],
      prices: free("minute"),
      read_on: readOn,
      tested: true,
    },
    {
      id: "sample-align",
      label: "Even word timings",
      capability: "align",
      is_default: true,
      settings: [],
      prices: free("minute"),
      read_on: readOn,
      tested: true,
    },
    {
      id: "sample-music",
      label: "Low tone",
      capability: "music",
      is_default: true,
      settings: [
        {
          name: "duration_seconds",
          label: "Length in seconds",
          kind: "whole-number",
          minimum: 1,
          maximum: 600,
          default: 10,
        },
      ],
      prices: free("second"),
      read_on: readOn,
      tested: true,
    },
    {
      id: "sample-video",
      label: "Plain color with a frame counter",
      capability: "video",
      is_default: true,
      settings: [
        {
          name: "duration_seconds",
          label: "Length in seconds",
          kind: "whole-number",
          minimum: 1,
          maximum: 60,
          default: 5,
        },
        {
          name: "with_audio",
          label: "Sound",
          kind: "switch",
          default: true,
        },
      ],
      prices: free("second"),
      read_on: readOn,
      accepts: ["first_frame", "last_frame", "reference_images"],
      tested: true,
    },
    ...newKindModels,
  ],
} as const;

function modelIdsOf(capability: Capability): string[] {
  return sampleDescription.models
    .filter((model) => model.capability === capability)
    .map((model) => model.id);
}

export function modelInput(capability: Capability) {
  const [defaultId] = modelIdsOf(capability);
  return z
    .string()
    .optional()
    .describe(`The id of the model. ${defaultId ?? ""} by default`);
}

export function unknownModelMessage(options: {
  capability: Capability;
  model: string | undefined;
}): string | undefined {
  const ids = modelIdsOf(options.capability);
  if (options.model === undefined || ids.includes(options.model)) {
    return undefined;
  }
  return `Unknown model "${options.model}". The ${options.capability} models of this server are: ${ids.join(", ")}.`;
}

export function registerDescribeTool(server: McpServer): void {
  server.registerTool(
    "describe_media_server",
    {
      description:
        "Describe this server: its label, where it runs, its keys, and its models with their settings and prices.",
      annotations: { readOnlyHint: true },
    },
    () => ({
      content: [{ type: "text", text: JSON.stringify(sampleDescription) }],
      structuredContent: { ...sampleDescription },
    }),
  );
}
