import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sizeTextOf, type NaturalModel } from "./naturalVoice/modelFiles.ts";
import {
  defaultNaturalVoice,
  naturalVoiceNames,
  type NaturalVoice,
} from "./naturalVoice/naturalVoice.ts";
import type { SystemVoice } from "./systemVoice/systemVoice.ts";

export const systemVoiceModel = "system-voice";
export const naturalVoiceModel = "natural-voice";
export const modelIds = [systemVoiceModel, naturalVoiceModel] as const;

const readOn = "2026-11-23";
const free = [{ usd: 0, unit: "minute", when: {} }] as const;

function voiceSetting(options: { choices: string[]; default: string }) {
  return [
    { name: "voice", label: "Voice", kind: "choice", ...options },
  ] as const;
}

export async function describeLocalVoice(options: {
  systemVoice: SystemVoice;
  naturalVoice: NaturalVoice;
  naturalModel: NaturalModel;
}) {
  const systemVoices = await options.systemVoice.listVoices();
  const [bestSystemVoice] = systemVoices;
  const downloaded = await options.naturalVoice.isDownloaded();
  return {
    label: "Voice of this computer",
    runs: "on-this-computer",
    keys: [],
    models: [
      {
        id: systemVoiceModel,
        label: "System voice",
        capability: "speech",
        is_default: true,
        settings:
          bestSystemVoice === undefined
            ? []
            : voiceSetting({ choices: systemVoices, default: bestSystemVoice }),
        prices: free,
        read_on: readOn,
        tested: true,
      },
      {
        id: naturalVoiceModel,
        label: downloaded
          ? "Natural voice"
          : `Natural voice. Download once, ${sizeTextOf(options.naturalModel)}`,
        capability: "speech",
        is_default: false,
        settings: voiceSetting({
          choices: naturalVoiceNames,
          default: defaultNaturalVoice,
        }),
        prices: free,
        read_on: readOn,
        tested: true,
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
        "Describe this server: the voice of this computer and the natural voice, with their voices. Free, no key, no network.",
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
