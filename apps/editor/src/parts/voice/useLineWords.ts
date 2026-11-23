import { useEffect, useState } from "react";
import { z } from "zod";
import type { EngineClient } from "../../engine/engineClient.js";
import type { VoiceLine } from "./voiceLines.js";

const wordsSchema = z.object({
  words: z.array(
    z.object({
      text: z.string(),
      start_frame: z.number(),
    }),
  ),
});

type TimedWords = z.infer<typeof wordsSchema>["words"];

async function wordsOfAsset(options: {
  client: EngineClient;
  assetId: string;
}): Promise<[string, TimedWords] | undefined> {
  const reply = await options.client.callTool({
    name: "get_asset_words",
    input: { asset_id: options.assetId },
  });
  if (!reply.ok || reply.value.isError) return undefined;
  const parsed = wordsSchema.safeParse(reply.value.data);
  return parsed.success ? [options.assetId, parsed.data.words] : undefined;
}

export function useLineWords(options: {
  client: EngineClient;
  assetIds: string[];
}): (line: VoiceLine) => string {
  const { client } = options;
  const key = options.assetIds.join(",");
  const [read, setRead] = useState<{
    key: string;
    words: Map<string, TimedWords>;
  }>();

  useEffect(() => {
    if (key === "") return;
    let isCurrent = true;
    Promise.all(
      key.split(",").map((assetId) => wordsOfAsset({ client, assetId })),
    )
      .then((found) => {
        if (!isCurrent) return;
        setRead({
          key,
          words: new Map(found.filter((entry) => entry !== undefined)),
        });
      })
      .catch(() => {
        setRead(undefined);
      });
    return () => {
      isCurrent = false;
    };
  }, [client, key]);

  return (line) => {
    if (read?.key !== key) return "";
    const words = read.words.get(line.window.assetId);
    if (words === undefined) return line.fallbackWords;
    const { assetStartFrame, durationFrames } = line.window;
    return words
      .filter(
        (word) =>
          word.start_frame >= assetStartFrame &&
          word.start_frame < assetStartFrame + durationFrames,
      )
      .map((word) => word.text)
      .join(" ");
  };
}
