import { useEffect, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { AudioClip } from "../engine/snapshot.js";
import type { PlaybackRun } from "./usePlayback.js";

const loudestVolume = 1;

function volumeOf(gainDecibels: number): number {
  return Math.min(loudestVolume, 10 ** (gainDecibels / 20));
}

function useAssetUrls(options: { client: EngineClient; assetIds: string[] }) {
  const { client } = options;
  const [urls, setUrls] = useState<ReadonlyMap<string, string>>(new Map());
  const assetKey = [...new Set(options.assetIds)].sort().join(" ");

  useEffect(() => {
    let isCurrent = true;
    const made: string[] = [];
    const assetIds = assetKey === "" ? [] : assetKey.split(" ");
    Promise.all(
      assetIds.map(async (assetId) => {
        const file = await client.assetFile(assetId);
        if (!file.ok) return undefined;
        const url = URL.createObjectURL(file.value);
        made.push(url);
        return [assetId, url] as const;
      }),
    )
      .then((entries) => {
        if (!isCurrent) return;
        setUrls(new Map(entries.filter((entry) => entry !== undefined)));
      })
      .catch(() => {
        setUrls(new Map());
      });
    return () => {
      isCurrent = false;
      made.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [client, assetKey]);

  return urls;
}

export function useSound(options: {
  client: EngineClient;
  clips: AudioClip[];
  framesPerSecond: number;
  run: PlaybackRun | undefined;
}) {
  const { client, clips, framesPerSecond, run } = options;
  const urls = useAssetUrls({
    client,
    assetIds: clips.map((clip) => clip.assetId),
  });

  useEffect(() => {
    if (run === undefined) return;
    const players: HTMLAudioElement[] = [];
    const timers: number[] = [];
    const nowFrame = () =>
      run.startFrame +
      ((performance.now() - run.startedAt) / 1000) * framesPerSecond;
    const start = (options: { clip: AudioClip; player: HTMLAudioElement }) => {
      const { clip, player } = options;
      const intoClip = Math.max(0, nowFrame() - clip.startFrame);
      const remaining = clip.durationFrames - intoClip;
      if (remaining <= 0) return;
      player.currentTime = (clip.assetStartFrame + intoClip) / framesPerSecond;
      player.play().catch(() => {
        player.pause();
      });
      timers.push(
        window.setTimeout(
          () => {
            player.pause();
          },
          (remaining / framesPerSecond) * 1000,
        ),
      );
    };
    for (const clip of clips) {
      const url = urls.get(clip.assetId);
      if (url === undefined) continue;
      const player = new Audio(url);
      player.volume = volumeOf(clip.gainDecibels);
      players.push(player);
      const wait = ((clip.startFrame - nowFrame()) / framesPerSecond) * 1000;
      if (wait > 0) {
        timers.push(
          window.setTimeout(() => {
            start({ clip, player });
          }, wait),
        );
      } else {
        start({ clip, player });
      }
    }
    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
      players.forEach((player) => {
        player.pause();
      });
    };
  }, [run, clips, urls, framesPerSecond]);
}
