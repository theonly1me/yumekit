import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { styleEntries } from "./styles/styleList.ts";
import {
  connectLocalMusic,
  filePathOf,
  resultText,
} from "./testing/connectLocalMusic.ts";

const describeServer = async (
  music: Awaited<ReturnType<typeof connectLocalMusic>>,
) =>
  (await music.callTool({ name: "describe_media_server", arguments: {} }))
    .structuredContent;

describe("the music of this computer", () => {
  it("has five styles in its data, and the owner approved none yet", () => {
    expect(styleEntries.map((entry) => entry.id)).toEqual([
      "minimal",
      "warm",
      "bright",
      "night",
      "cinematic",
    ]);
    expect(styleEntries.filter((entry) => entry.approved)).toEqual([]);
  });

  it("offers each waiting style with its line and the mark not approved when waiting styles are on", async () => {
    const music = await connectLocalMusic({ withWaitingStyles: true });

    expect(await describeServer(music)).toMatchObject({
      label: "Music from this computer",
      runs: "on-this-computer",
      keys: [],
      models: [
        {
          id: "music-bed",
          capability: "music",
          is_default: true,
          prices: [{ usd: 0 }],
          settings: [
            {
              name: "style",
              choices: ["minimal", "warm", "bright", "night", "cinematic"],
              default: "minimal",
              choice_details: styleEntries.map((entry) => ({
                choice: entry.id,
                label: entry.label,
                line: entry.line,
                approved: false,
              })),
            },
            { name: "tempo", minimum: 60, maximum: 200, default: 110 },
            { name: "seed" },
          ],
        },
      ],
    });
    expect(await music.toolNames()).toContain("generate_music");
  });

  it("offers no music when no style is approved and waiting styles are off, as in a release", async () => {
    const music = await connectLocalMusic({ withWaitingStyles: false });

    expect(await describeServer(music)).toMatchObject({ models: [] });
    expect(await music.toolNames()).not.toContain("generate_music");
  });

  it("offers only the approved style in a release, and refuses a waiting style by name", async () => {
    const music = await connectLocalMusic({
      withWaitingStyles: false,
      styles: styleEntries.map((entry) => ({
        ...entry,
        approved: entry.id === "warm",
      })),
    });

    expect(await describeServer(music)).toMatchObject({
      models: [
        {
          settings: [
            { choices: ["warm"], default: "warm" },
            { name: "tempo" },
            { name: "seed" },
          ],
        },
      ],
    });
    const refused = await music.makeMusic({
      style: "night",
      duration_seconds: 2,
    });
    expect(refused.isError).toBe(true);
    expect(resultText(refused)).toBe(
      'The style "night" is not offered. Pick one of: warm.',
    );
  });

  it("picks the style from the words of the prompt when the call names none", async () => {
    const music = await connectLocalMusic({ withWaitingStyles: true });

    const fromWords = await music.makeMusic({
      prompt: "a dark and moody late scene",
      seed: 3,
      duration_seconds: 2,
      file_stem: "words",
    });
    const named = await music.makeMusic({
      style: "night",
      seed: 3,
      duration_seconds: 2,
      file_stem: "named",
    });

    expect(fromWords.structuredContent).toMatchObject({
      files: [{ kind: "audio", duration_seconds: 2 }],
      cost_usd: 0,
    });
    expect(
      (await readFile(filePathOf(fromWords))).equals(
        await readFile(filePathOf(named)),
      ),
    ).toBe(true);
  });
});
