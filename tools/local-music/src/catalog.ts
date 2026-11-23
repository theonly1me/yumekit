import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StyleEntry } from "./styles/styleList.ts";

export const musicModel = "music-bed";
export const serviceLabel = "Music from this computer";
export const defaultTempo = 110;
export const tempoLimits = { minimum: 60, maximum: 200 } as const;
export const seedLimits = { minimum: 1, maximum: 999_999 } as const;

const readOn = "2026-11-24";

function musicModelOf(offered: readonly StyleEntry[]) {
  const [first] = offered;
  if (first === undefined) return [];
  return [
    {
      id: musicModel,
      label: serviceLabel,
      capability: "music",
      is_default: true,
      settings: [
        {
          name: "style",
          label: "Style",
          kind: "choice",
          choices: offered.map((entry) => entry.id),
          default: first.id,
          choice_details: offered.map((entry) => ({
            choice: entry.id,
            label: entry.label,
            line: entry.line,
            approved: entry.approved,
          })),
        },
        {
          name: "tempo",
          label: "Beats each minute",
          kind: "whole-number",
          ...tempoLimits,
          default: defaultTempo,
        },
        {
          name: "seed",
          label: "Version",
          kind: "whole-number",
          ...seedLimits,
          default: 1,
        },
      ],
      prices: [{ usd: 0, unit: "minute", when: {} }],
      read_on: readOn,
      tested: true,
    },
  ];
}

export function describeLocalMusic(offered: readonly StyleEntry[]) {
  return {
    label: serviceLabel,
    runs: "on-this-computer",
    keys: [],
    models: musicModelOf(offered),
  };
}

export function registerDescribeTool(options: {
  server: McpServer;
  offered: readonly StyleEntry[];
}): void {
  options.server.registerTool(
    "describe_media_server",
    {
      description:
        "Describe this server: music beds made from code on this computer, with their styles. Free, no key, no download.",
      annotations: { readOnlyHint: true },
    },
    () => {
      const description = describeLocalMusic(options.offered);
      return {
        content: [{ type: "text", text: JSON.stringify(description) }],
        structuredContent: { ...description },
      };
    },
  );
}
