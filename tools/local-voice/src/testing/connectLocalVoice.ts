import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
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
import { kokoroVoices, type VoiceEntry } from "../naturalVoice/voices.ts";
import { onTestFinished } from "vitest";

export const lexiconLines = [
  "meet m ˈ i t",
  "lumen l ˈ u m ə n",
  "the ð ə",
  "lamp l ˈ æ m p",
  "it ɪ t",
  "costs k ˈ ɔ s t s",
  "forty f ˈ ɔ ɹ T i",
  "nine n ˈ I n",
  "dollars d ˈ ɑ l ə ɹ z",
  "in ɪ n",
  "twenty t w ˈ ɛ n T i",
  "six s ˈ ɪ k s",
  "hello h ə l ˈ O",
  "hoe h ˈ O",
  "she ʃ i",
  "you j u",
  "may m ˈ A",
  "kit k ˈ ɪ t",
];

export function fakeModel(): {
  model: NaturalModel;
  served: Map<string, Buffer>;
} {
  const contents = new Map<string, Buffer>([
    ["model.int8.onnx", Buffer.from("model")],
    ["lexicon-us-en.txt", Buffer.from(lexiconLines.join("\n"))],
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
  wordListPaths: string[];
}

function fakeSpeaker(options: {
  spoken: SpokenCall[];
  wordListPaths: string[];
}): NaturalSpeaker {
  return {
    speak: (call) => {
      options.spoken.push({ ...call, wordListPaths: options.wordListPaths });
      return Promise.resolve({
        samples: new Float32Array(24000).fill(0.25),
        sampleRate: 24000,
      });
    },
  };
}

export type FetchFake = (url: string) => Promise<Response>;

export function servingFetch(options: {
  served: Map<string, Buffer>;
  fetched: string[];
}): FetchFake {
  return (url) => {
    options.fetched.push(url);
    const bytes = options.served.get(url);
    return Promise.resolve(
      bytes === undefined
        ? new Response("gone", { status: 404 })
        : new Response(bytes),
    );
  };
}

export async function connectLocalVoice(options: {
  configurationFolder: string;
  fetchFile: FetchFake;
  spoken?: SpokenCall[];
  model?: NaturalModel;
  voices?: VoiceEntry[];
}) {
  const server = createLocalVoiceServer({
    environment: { YUMEKIT_CONFIG_DIRECTORY: options.configurationFolder },
    fetchFile: options.fetchFile,
    loadSpeaker: ({ wordListPaths }) =>
      Promise.resolve({
        ok: true,
        value: fakeSpeaker({ spoken: options.spoken ?? [], wordListPaths }),
      }),
    naturalModel: options.model ?? fakeModel().model,
    voices: options.voices ?? kokoroVoices,
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
      onProgress?: (progress: {
        progress: number;
        message?: string | undefined;
      }) => void;
    }) => {
      const { onProgress } = call;
      return CallToolResultSchema.parse(
        await client.callTool(
          { name: call.name, arguments: call.arguments },
          undefined,
          onProgress === undefined ? undefined : { onprogress: onProgress },
        ),
      );
    },
  };
}

export function resultText(result: CallToolResult): string {
  return result.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}

export async function temporaryFolder(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), "yumekit-local-voice-"));
  onTestFinished(() => rm(folder, { recursive: true, force: true }));
  return folder;
}
