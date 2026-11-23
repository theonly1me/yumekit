import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectLocalVoice,
  fakeModel,
  fakeSay,
  resultText,
  temporaryFolder,
  type SpokenCall,
} from "./testing/connectLocalVoice.ts";

async function naturalSetup(options: { served?: Map<string, Buffer> } = {}) {
  const folder = await temporaryFolder();
  const { model, served } = fakeModel();
  const fetched: string[] = [];
  const spoken: SpokenCall[] = [];
  const voice = await connectLocalVoice({
    platform: "darwin",
    runProgram: fakeSay({ calls: [], seconds: 1 }),
    configurationFolder: join(folder, "config"),
    fetched,
    spoken,
    served: options.served ?? served,
    model,
  });
  const speak = (text: string) =>
    voice.callTool({
      name: "generate_speech",
      arguments: {
        model: "natural-voice",
        text,
        output_directory: join(folder, "assets"),
        file_stem: "line",
      },
    });
  const describeLabel = async () => {
    const description = await voice.callTool({
      name: "describe_media_server",
      arguments: {},
    });
    return JSON.stringify(description.structuredContent);
  };
  return { folder, fetched, spoken, speak, describeLabel };
}

describe("generate_speech with the natural voice", () => {
  it("downloads the model once into the configuration folder, then speaks with no network", async () => {
    const setup = await naturalSetup();

    const first = await setup.speak("Meet Lumen.");
    const fetchedAfterFirst = setup.fetched.length;
    const second = await setup.speak("Meet the lamp.");

    expect(first.isError).toBeUndefined();
    expect(second.isError).toBeUndefined();
    expect(fetchedAfterFirst).toBe(2);
    expect(setup.fetched).toHaveLength(2);
    expect(
      (
        await readdir(join(setup.folder, "config", "voices", "kokoro-test"))
      ).sort(),
    ).toEqual(["lexicon-us-en.txt", "model.int8.onnx"]);
  });

  it("returns a WAV file of one second at full level for one second of samples", async () => {
    const setup = await naturalSetup();

    const result = await setup.speak("Meet Lumen.");

    const path = join(setup.folder, "assets", "line.wav");
    expect(result.structuredContent).toEqual({
      files: [{ path, kind: "audio", duration_seconds: 1 }],
    });
    const wav = await readFile(path);
    expect(wav.length).toBe(44 + 24000 * 2);
    expect(wav.readInt16LE(44)).toBe(Math.round(0.89 * 32767));
  });

  it("speaks numbers and prices as words, and uses the voice Heart by default", async () => {
    const setup = await naturalSetup();

    await setup.speak("It costs $49 in 2026.");

    expect(setup.spoken).toEqual([
      {
        text: "It costs forty nine dollars in twenty twenty six.",
        speakerId: 3,
        speed: 1,
      },
    ]);
  });

  it("refuses a text with a word that the voice does not know, and names the word", async () => {
    const setup = await naturalSetup();

    const result = await setup.speak("Meet Zorblatt, the lamp.");

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain(
      "does not know these words: Zorblatt.",
    );
    expect(setup.spoken).toEqual([]);
  });

  it("keeps no file and says so when a download is not the expected file", async () => {
    const { served } = fakeModel();
    const broken = new Map(
      [...served].map(([url, bytes]) => [
        url,
        Buffer.concat([bytes, Buffer.from("!")]),
      ]),
    );
    const setup = await naturalSetup({ served: broken });

    const result = await setup.speak("Meet Lumen.");

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain("not the expected file");
    expect(
      await readdir(join(setup.folder, "config", "voices", "kokoro-test")),
    ).toEqual([]);
  });

  it("shows the size of the download in the model label until the model is there", async () => {
    const setup = await naturalSetup();

    const before = await setup.describeLabel();
    await setup.speak("Meet Lumen.");
    const after = await setup.describeLabel();

    expect(before).toContain('"label":"Natural voice. Download once, 0 MB"');
    expect(after).toContain('"label":"Natural voice"');
  });
});
