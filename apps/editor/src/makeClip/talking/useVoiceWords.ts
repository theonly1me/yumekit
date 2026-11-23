import { useEffect, useState } from "react";
import { z } from "zod";
import type { EngineClient } from "../../engine/engineClient.js";
import type { SceneVoice } from "./talkingFacts.js";

const wordsSchema = z.object({
  words: z.array(
    z.object({
      text: z.string(),
      start_frame: z.number(),
      end_frame: z.number(),
    }),
  ),
});

export function useVoiceWords(options: {
  client: EngineClient;
  voice: SceneVoice | undefined;
}): string {
  const { client, voice } = options;
  const [read, setRead] = useState<{ key: string; words: string }>();
  const key =
    voice === undefined
      ? ""
      : `${voice.assetId}:${String(voice.assetStartFrame)}:${String(voice.durationFrames)}`;

  const assetId = voice?.assetId;
  const startFrame = voice?.assetStartFrame ?? 0;
  const endFrame = startFrame + (voice?.durationFrames ?? 0);
  const needsWords = voice?.words === "";

  useEffect(() => {
    if (!needsWords || assetId === undefined) return;
    let isCurrent = true;
    client
      .callTool({ name: "get_asset_words", input: { asset_id: assetId } })
      .then((reply) => {
        if (!isCurrent || !reply.ok || reply.value.isError) return;
        const parsed = wordsSchema.safeParse(reply.value.data);
        if (!parsed.success) return;
        const words = parsed.data.words
          .filter(
            (word) =>
              word.start_frame >= startFrame && word.start_frame < endFrame,
          )
          .map((word) => word.text)
          .join(" ");
        setRead({ key, words });
      })
      .catch(() => {
        setRead(undefined);
      });
    return () => {
      isCurrent = false;
    };
  }, [client, key, assetId, startFrame, endFrame, needsWords]);

  if (voice === undefined) return "";
  if (voice.words !== "") return voice.words;
  return read?.key === key ? read.words : "";
}
