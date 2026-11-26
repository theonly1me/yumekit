import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Outcome } from "../toolResults.ts";
import type { LoadSpeaker, NaturalSpeaker } from "./naturalSpeaker.ts";

type LoadedSpeaker = Promise<Outcome<NaturalSpeaker, string>>;

async function wordListPathOf(options: {
  lines: string[];
  modelFolder: string;
}): Promise<string> {
  const text = `${[...options.lines].sort().join("\n")}\n`;
  const name = createHash("sha256").update(text).digest("hex").slice(0, 16);
  const folder = join(options.modelFolder, "word-lists");
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const path = join(folder, `${name}.txt`);
  await writeFile(path, text);
  return path;
}

export function createSpeakerCache(options: {
  folder: string;
  loadSpeaker: LoadSpeaker;
}) {
  let plain: LoadedSpeaker | undefined;
  let withWords: { key: string; speaker: LoadedSpeaker } | undefined;

  const settled = async (loading: {
    loaded: LoadedSpeaker;
    forget: () => void;
  }) => {
    const result = await loading.loaded;
    if (!result.ok) loading.forget();
    return result;
  };

  return {
    speakerFor: async (lines: string[]): LoadedSpeaker => {
      const { folder } = options;
      if (lines.length === 0) {
        plain ??= options.loadSpeaker({ folder, wordListPaths: [] });
        return settled({
          loaded: plain,
          forget: () => {
            plain = undefined;
          },
        });
      }
      const key = [...lines].sort().join("\n");
      if (withWords?.key !== key) {
        const path = await wordListPathOf({ lines, modelFolder: folder });
        withWords = {
          key,
          speaker: options.loadSpeaker({ folder, wordListPaths: [path] }),
        };
      }
      return settled({
        loaded: withWords.speaker,
        forget: () => {
          withWords = undefined;
        },
      });
    },
  };
}
