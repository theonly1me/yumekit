import { createHash } from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolResultSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { createLocalVoiceServer } from "../createLocalVoiceServer.ts";
import type { NaturalModel } from "../naturalVoice/modelFiles.ts";
import type { NaturalSpeaker } from "../naturalVoice/naturalSpeaker.ts";
import type { ProgramCall, RunProgram } from "../systemVoice/runProgram.ts";

export const sayListing = [
  "Albert              en_US    # Hello! My name is Albert.",
  "Daniel              en_GB    # Hello! My name is Daniel.",
  "Samantha            en_US    # Hello! My name is Samantha.",
  "Thomas              fr_FR    # Bonjour, je m’appelle Thomas.",
].join("\n");

export const lexiconWords = [
  "meet",
  "lumen",
  "the",
  "lamp",
  "it",
  "costs",
  "forty",
  "nine",
  "dollars",
  "in",
  "twenty",
  "six",
  "hello",
];

export function fakeWav(seconds: number): Buffer {
  const sampleRate = 8000;
  const dataLength = Math.round(seconds * sampleRate) * 2;
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
  return bytes;
}

export function fakeSay(options: {
  calls: ProgramCall[];
  seconds: number;
}): RunProgram {
  return async (call) => {
    options.calls.push(call);
    if (call.args.includes("?")) {
      return {
        kind: "finished",
        exitCode: 0,
        output: sayListing,
        errorOutput: "",
      };
    }
    const outputIndex = call.args.indexOf("-o");
    const path = call.args[outputIndex + 1];
    if (path !== undefined) await writeFile(path, fakeWav(options.seconds));
    return { kind: "finished", exitCode: 0, output: "", errorOutput: "" };
  };
}

export const noProgram: RunProgram = () =>
  Promise.resolve({ kind: "not-found", message: "spawn espeak-ng ENOENT" });

export function fakeModel(): {
  model: NaturalModel;
  served: Map<string, Buffer>;
} {
  const contents = new Map<string, Buffer>([
    ["model.int8.onnx", Buffer.from("model")],
    [
      "lexicon-us-en.txt",
      Buffer.from(lexiconWords.map((word) => `${word} x`).join("\n")),
    ],
  ]);
  const served = new Map<string, Buffer>();
  const files = [...contents].map(([name, bytes]) => {
    served.set(`https://models.test/kokoro/${name}`, bytes);
    return {
      name,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  });
  return {
    served,
    model: {
      folderName: "kokoro-test",
      sourceUrl: "https://models.test/kokoro",
      files,
    },
  };
}

export interface SpokenCall {
  text: string;
  speakerId: number;
  speed: number;
}

export function fakeSpeaker(spoken: SpokenCall[]): NaturalSpeaker {
  return {
    speak: (call) => {
      spoken.push(call);
      return Promise.resolve({
        samples: new Float32Array(24000).fill(0.25),
        sampleRate: 24000,
      });
    },
  };
}

export async function connectLocalVoice(options: {
  platform: NodeJS.Platform;
  runProgram: RunProgram;
  configurationFolder: string;
  fetched?: string[];
  spoken?: SpokenCall[];
  served?: Map<string, Buffer>;
  model?: NaturalModel;
}) {
  const served = options.served ?? new Map<string, Buffer>();
  const server = createLocalVoiceServer({
    platform: options.platform,
    environment: { YUMEKIT_CONFIG_DIRECTORY: options.configurationFolder },
    runProgram: options.runProgram,
    fetchFile: (url) => {
      options.fetched?.push(url);
      const bytes = served.get(url);
      return Promise.resolve(
        bytes === undefined
          ? new Response("gone", { status: 404 })
          : new Response(bytes),
      );
    },
    loadSpeaker: () =>
      Promise.resolve({ ok: true, value: fakeSpeaker(options.spoken ?? []) }),
    naturalModel: options.model ?? fakeModel().model,
  });
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    callTool: async (call: {
      name: string;
      arguments: Record<string, unknown>;
    }) => CallToolResultSchema.parse(await client.callTool(call)),
    client,
  };
}

export function resultText(result: CallToolResult): string {
  return result.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}

export function temporaryFolder(): Promise<string> {
  return mkdtemp(join(tmpdir(), "yumekit-local-voice-"));
}
