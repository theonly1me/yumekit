import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const keyVariable = "YUMEKIT_PRICED_KEY";
const expiredKey = "expired-key";
const extraMusicSeconds = 2.7;
const sampleRate = 8000;

const model = (options: {
  id: string;
  capability: string;
  prices: object[];
  settings?: object[];
  isDefault?: boolean;
}) => ({
  id: options.id,
  label: options.id,
  capability: options.capability,
  is_default: options.isDefault ?? true,
  settings: options.settings ?? [],
  prices: options.prices,
  read_on: "2026-11-24",
});

const resolution = {
  name: "resolution",
  label: "Resolution",
  kind: "choice",
  choices: ["1K", "2K"],
  default: "1K",
};

const description = {
  label: "Priced test server",
  runs: "hosted",
  keys: [
    {
      variable: keyVariable,
      label: "Priced test key",
      get_key_url: "https://example.com/priced-keys",
      steps: ["Open the key page."],
    },
  ],
  models: [
    model({
      id: "priced-image",
      capability: "image",
      settings: [resolution],
      prices: [
        { usd: 0.4, unit: "image", when: { resolution: "1K" } },
        { usd: 0.6, unit: "image", when: { resolution: "2K" } },
      ],
    }),
    model({
      id: "priced-image-pro",
      capability: "image",
      isDefault: false,
      settings: [resolution],
      prices: [
        { usd: 1.2, unit: "image", when: { resolution: "1K" } },
        { usd: 1.2, unit: "image", when: { resolution: "2K" } },
      ],
    }),
    model({ id: "unpriced-music", capability: "music", prices: [] }),
    model({
      id: "priced-video",
      capability: "video",
      prices: [{ usd: 0.3, unit: "second", when: {} }],
    }),
  ],
};

function silentWav(seconds: number): Buffer {
  const dataBytes = Math.round(seconds * sampleRate) * 2;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataBytes, 40);
  return Buffer.concat([header, Buffer.alloc(dataBytes)]);
}

async function noteCall(tool: string): Promise<void> {
  const file = process.env["YUMEKIT_PRICED_CALLS"];
  if (file) await appendFile(file, `${tool}\n`);
}

const server = new McpServer({
  name: "yumekit-priced-media",
  version: "0.0.0",
});

server.registerTool("describe_media_server", {}, () => ({
  content: [],
  structuredContent: { ...description },
}));

server.registerTool("check_key", {}, async () => {
  await noteCall("check_key");
  const valid = process.env[keyVariable] !== expiredKey;
  const message = valid ? "The key works." : "The Priced API rejected the key.";
  return { content: [], structuredContent: { valid, message } };
});

const fileInput = {
  prompt: z.string(),
  output_directory: z.string(),
  file_stem: z.string(),
};
const imageInput = {
  ...fileInput,
  width_pixels: z.number().optional(),
  height_pixels: z.number().optional(),
  resolution: z.string().optional(),
};
const lengthInput = { ...fileInput, duration_seconds: z.number() };

async function madeFile(options: {
  tool: string;
  input: { output_directory: string; file_stem: string };
  file: { kind: string; extension: string; bytes: Buffer };
  facts?: object;
}) {
  await noteCall(options.tool);
  if (process.env[keyVariable] === expiredKey) {
    const text = "The Priced API answered 401: Your API key has expired.";
    return { isError: true, content: [{ type: "text" as const, text }] };
  }
  const { output_directory: folder, file_stem: stem } = options.input;
  await mkdir(folder, { recursive: true });
  const path = join(folder, `${stem}.${options.file.extension}`);
  await writeFile(path, options.file.bytes);
  const file = { path, kind: options.file.kind, ...options.facts };
  return { content: [], structuredContent: { files: [file] } };
}

server.registerTool("generate_image", { inputSchema: imageInput }, (input) =>
  madeFile({
    tool: "generate_image",
    input,
    file: { kind: "image", extension: "png", bytes: Buffer.from("made") },
    facts: { width_pixels: 1376, height_pixels: 768 },
  }),
);

server.registerTool("generate_music", { inputSchema: lengthInput }, (input) =>
  madeFile({
    tool: "generate_music",
    input,
    file: {
      kind: "audio",
      extension: "wav",
      bytes: silentWav(input.duration_seconds + extraMusicSeconds),
    },
  }),
);

server.registerTool("generate_video", { inputSchema: lengthInput }, (input) =>
  madeFile({
    tool: "generate_video",
    input,
    file: { kind: "video", extension: "mp4", bytes: Buffer.from("made") },
  }),
);

await server.connect(new StdioServerTransport());
