import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectLocalVoice,
  fakeModel,
  resultText,
  servingFetch,
  temporaryFolder,
  type FetchFake,
  type SpokenCall,
} from "./testing/connectLocalVoice.ts";

async function naturalSetup(options: { fetchFile?: FetchFake } = {}) {
  const folder = await temporaryFolder();
  const { model, served } = fakeModel();
  const fetched: string[] = [];
  const spoken: SpokenCall[] = [];
  const voice = await connectLocalVoice({
    configurationFolder: join(folder, "config"),
    fetchFile: options.fetchFile ?? servingFetch({ served, fetched }),
    spoken,
    model,
  });
  const speak = (input: Record<string, unknown>) =>
    voice.callTool({
      name: "generate_speech",
      arguments: {
        output_directory: join(folder, "assets"),
        file_stem: "line",
        ...input,
      },
    });
  return { folder, fetched, spoken, speak, voice };
}

describe("generate_speech with the natural voice", () => {
  it("downloads the model once at the first call with no model named, then speaks with no network", async () => {
    const setup = await naturalSetup();

    const first = await setup.speak({ text: "Meet Lumen." });
    const second = await setup.speak({ text: "Meet the lamp." });

    expect(first.isError).toBeUndefined();
    expect(second.isError).toBeUndefined();
    expect(setup.fetched).toHaveLength(2);
    expect(
      (
        await readdir(join(setup.folder, "config", "voices", "kokoro-test"))
      ).sort(),
    ).toEqual(["lexicon-us-en.txt", "model.int8.onnx"]);
  });

  it("returns a WAV file of one second at full level for one second of samples", async () => {
    const setup = await naturalSetup();

    const result = await setup.speak({ text: "Meet Lumen." });

    const path = join(setup.folder, "assets", "line.wav");
    expect(result.structuredContent).toEqual({
      files: [{ path, kind: "audio", duration_seconds: 1 }],
    });
    const wav = await readFile(path);
    expect(wav.length).toBe(44 + 24000 * 2);
    expect(wav.readInt16LE(44)).toBe(Math.round(0.89 * 32767));
  });

  it("speaks numbers and prices as words with the voice Heart", async () => {
    const setup = await naturalSetup();

    await setup.speak({ text: "It costs $49 in 2026." });

    expect(setup.spoken).toMatchObject([
      {
        text: "It costs forty nine dollars in twenty twenty six.",
        speakerId: 3,
        speed: 1,
      },
    ]);
  });

  it("refuses a voice that the owner did not approve", async () => {
    const setup = await naturalSetup();

    const result = await setup.speak({ text: "Meet Lumen.", voice: "Bella" });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "voice must be one of: Heart. It was Bella.",
    );
    expect(setup.fetched).toEqual([]);
  });

  it("refuses a word that the voice does not know, names it, and says how to give its sound", async () => {
    const setup = await naturalSetup();

    const result = await setup.speak({ text: "Meet Zorblatt, the lamp." });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain(
      'does not know these words: Zorblatt. Give each one in the input pronunciations as it sounds, in common English words, for example {"Zorblatt": "hoe she"}.',
    );
    expect(setup.spoken).toEqual([]);
  });

  it("says that the voice needs one download when the network is not there, and keeps no file", async () => {
    const setup = await naturalSetup({
      fetchFile: () => Promise.reject(new TypeError("fetch failed")),
    });

    const result = await setup.speak({ text: "Meet Lumen." });

    expect(resultText(result)).toBe(
      "The voice needs one download. Connect to the internet and try again.",
    );
    expect(setup.spoken).toEqual([]);
    expect(
      await readdir(join(setup.folder, "config", "voices", "kokoro-test")),
    ).toEqual([]);
  });

  it("keeps no file and says so when a download is not the expected file", async () => {
    const { served } = fakeModel();
    const broken = new Map(
      [...served].map(([url, bytes]) => [
        url,
        Buffer.concat([bytes, Buffer.from("!")]),
      ]),
    );
    const setup = await naturalSetup({
      fetchFile: servingFetch({ served: broken, fetched: [] }),
    });

    const result = await setup.speak({ text: "Meet Lumen." });

    expect(resultText(result)).toContain("not the expected file");
    expect(
      await readdir(join(setup.folder, "config", "voices", "kokoro-test")),
    ).toEqual([]);
  });
});
