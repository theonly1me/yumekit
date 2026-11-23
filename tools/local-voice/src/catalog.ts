import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { totalBytesOf, type NaturalModel } from "./naturalVoice/modelFiles.ts";
import type { NaturalVoice } from "./naturalVoice/naturalVoice.ts";
import { approvedVoicesOf, type VoiceEntry } from "./naturalVoice/voices.ts";

export const naturalVoiceModel = "natural-voice";
export const modelIds = [naturalVoiceModel] as const;

const readOn = "2026-11-23";
const free = [{ usd: 0, unit: "minute", when: {} }] as const;

export async function describeLocalVoice(options: {
  naturalVoice: NaturalVoice;
  naturalModel: NaturalModel;
  voices: VoiceEntry[];
}) {
  const names = approvedVoicesOf(options.voices).map((voice) => voice.name);
  const [firstName] = names;
  return {
    label: "Natural voice",
    runs: "on-this-computer",
    keys: [],
    models: [
      {
        id: naturalVoiceModel,
        label: "Natural voice",
        capability: "speech",
        is_default: true,
        settings:
          firstName === undefined
            ? []
            : [
                {
                  name: "voice",
                  label: "Voice",
                  kind: "choice",
                  choices: names,
                  default: firstName,
                },
              ],
        prices: free,
        read_on: readOn,
        tested: true,
        download: {
          bytes: totalBytesOf(options.naturalModel),
          ready: await options.naturalVoice.isDownloaded(),
        },
      },
    ],
  };
}

export function registerDescribeTool(options: {
  server: McpServer;
  describe: () => ReturnType<typeof describeLocalVoice>;
}): void {
  options.server.registerTool(
    "describe_media_server",
    {
      description:
        "Describe this server: the natural voice, with its voices and its one download. Free, no key.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const description = await options.describe();
      return {
        content: [{ type: "text", text: JSON.stringify(description) }],
        structuredContent: { ...description },
      };
    },
  );
}
