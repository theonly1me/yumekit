import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kokoroVoices } from "./naturalVoice/voices.ts";
import {
  connectLocalVoice,
  fakeModel,
  resultText,
  servingFetch,
  temporaryFolder,
  type SpokenCall,
} from "./testing/connectLocalVoice.ts";

async function voiceSetup() {
  const folder = await temporaryFolder();
  const { model, served } = fakeModel();
  const fetched: string[] = [];
  const spoken: SpokenCall[] = [];
  const voice = await connectLocalVoice({
    configurationFolder: join(folder, "config"),
    fetchFile: servingFetch({ served, fetched }),
    spoken,
    model,
  });
  const describeServer = async () =>
    (await voice.callTool({ name: "describe_media_server", arguments: {} }))
      .structuredContent;
  return { folder, fetched, spoken, voice, model, describeServer };
}

describe("the voices and the download of the natural voice", () => {
  it("describes one model, Natural voice, with only the approved voice and the size of its download", async () => {
    const setup = await voiceSetup();
    let totalBytes = 0;
    for (const file of setup.model.files) totalBytes += file.bytes;

    expect(await setup.describeServer()).toMatchObject({
      label: "Natural voice",
      runs: "on-this-computer",
      keys: [],
      models: [
        {
          id: "natural-voice",
          label: "Natural voice",
          is_default: true,
          settings: [{ name: "voice", choices: ["Heart"], default: "Heart" }],
          download: { bytes: totalBytes, ready: false },
        },
      ],
    });
  });

  it("has 54 voices in its data, and the owner approved only Heart", () => {
    expect(kokoroVoices).toHaveLength(54);
    expect(
      kokoroVoices.filter((voice) => voice.approved).map((voice) => voice.code),
    ).toEqual(["af_heart"]);
    expect(new Set(kokoroVoices.map((voice) => voice.name)).size).toBe(54);
  });

  it("downloads with prepare_model, sends the download line as progress, and then describes the model as ready", async () => {
    const setup = await voiceSetup();
    const messages: string[] = [];

    const prepared = await setup.voice.callTool({
      name: "prepare_model",
      arguments: {},
      onProgress: (progress) => {
        messages.push(progress.message ?? "");
      },
    });

    expect(prepared.isError).toBeUndefined();
    expect(messages.length).toBeGreaterThan(0);
    expect(new Set(messages)).toEqual(
      new Set(["Getting the natural voice, one time, 0 MB"]),
    );
    expect(await setup.describeServer()).toMatchObject({
      models: [{ download: { ready: true } }],
    });
  });

  it("says a name with the sound spelling of pronunciations, as one word in an added word list", async () => {
    const setup = await voiceSetup();

    const result = await setup.voice.callTool({
      name: "generate_speech",
      arguments: {
        text: "Meet Hoshi, the yumekit lamp.",
        pronunciations: { Hoshi: "hoe she", yumekit: "you may kit" },
        output_directory: join(setup.folder, "assets"),
        file_stem: "line",
      },
    });

    expect(result.isError).toBeUndefined();
    const [call] = setup.spoken;
    expect(call?.text).toBe("Meet Hoshi, the yumekit lamp.");
    const [wordListPath = ""] = call?.wordListPaths ?? [];
    expect((await readFile(wordListPath, "utf8")).split("\n")).toEqual([
      "hoshi h ˈ O ʃ i",
      "yumekit j u m ˈ A k ˌ ɪ t",
      "",
    ]);
  });

  it("refuses a sound spelling with a word that the voice does not know", async () => {
    const setup = await voiceSetup();

    const result = await setup.voice.callTool({
      name: "generate_speech",
      arguments: {
        text: "Meet Hoshi.",
        pronunciations: { Hoshi: "hosh ee" },
        output_directory: join(setup.folder, "assets"),
        file_stem: "line",
      },
    });

    expect(resultText(result)).toBe(
      'The natural voice does not know "hosh" in the sound spelling of "Hoshi". Spell "Hoshi" with other common English words.',
    );
    expect(setup.spoken).toEqual([]);
  });
});
