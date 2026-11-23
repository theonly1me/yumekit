import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "yumekit-voice-media", version: "0" });
const sampleRate = 8000;
const secondsPerWord = 0.3;
const quietSeconds = 0.2;

function speechLikeWav(seconds: number): Buffer {
  const sampleCount = Math.round(seconds * sampleRate);
  const quietSamples = Math.round(quietSeconds * sampleRate);
  const dataLength = sampleCount * 2;
  const bytes = Buffer.alloc(44 + dataLength);
  bytes.write("RIFF", 0, "ascii");
  bytes.writeUInt32LE(36 + dataLength, 4);
  bytes.write("WAVEfmt ", 8, "ascii");
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36, "ascii");
  bytes.writeUInt32LE(dataLength, 40);
  for (
    let index = quietSamples;
    index < sampleCount - quietSamples;
    index += 1
  ) {
    const value = Math.sin((2 * Math.PI * 220 * index) / sampleRate) * 0.3;
    bytes.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }
  return bytes;
}

server.registerTool("describe_media_server", {}, () => ({
  content: [],
  structuredContent: {
    label: "Natural voice",
    runs: "on-this-computer",
    keys: [],
    models: [
      {
        id: "natural-voice",
        label: "Natural voice",
        capability: "speech",
        is_default: true,
        settings: [],
        prices: [{ usd: 0, unit: "minute", when: {} }],
        read_on: "2026-11-23",
        download: { bytes: 148_000_000, ready: true },
      },
    ],
  },
}));

server.registerTool(
  "generate_speech",
  {
    inputSchema: {
      text: z.string(),
      output_directory: z.string(),
      file_stem: z.string(),
      model: z.string().optional(),
    },
  },
  async (input) => {
    const wordCount = input.text.split(/\s+/).filter(Boolean).length;
    const seconds = Math.max(1, wordCount) * secondsPerWord;
    await mkdir(input.output_directory, { recursive: true });
    const path = join(input.output_directory, `${input.file_stem}.wav`);
    await writeFile(path, speechLikeWav(seconds));
    return {
      content: [],
      structuredContent: {
        files: [{ path, kind: "audio", duration_seconds: seconds }],
      },
    };
  },
);

await server.connect(new StdioServerTransport());
