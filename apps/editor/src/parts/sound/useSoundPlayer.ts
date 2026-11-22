import { useEffect, useRef, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { useAssetUrl } from "../../makeClip/useAssetUrl.js";

export interface SoundPiece {
  assetId: string;
  startSeconds: number;
  lengthSeconds: number;
}

const playing: { stop: (() => void) | undefined } = { stop: undefined };

export function useSoundPlayer(options: {
  client: EngineClient;
  piece: SoundPiece | undefined;
}) {
  const { piece } = options;
  const url = useAssetUrl({ client: options.client, assetId: piece?.assetId });
  const player = useRef<HTMLAudioElement>(undefined);
  const [isPlaying, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const startSeconds = piece?.startSeconds ?? 0;
  const lengthSeconds = piece?.lengthSeconds ?? 0;

  useEffect(() => {
    if (url === undefined) return;
    const audio = new Audio(url);
    player.current = audio;
    const stop = () => {
      audio.pause();
      setPlaying(false);
      setPlayed(0);
    };
    const onTime = () => {
      const into = audio.currentTime - startSeconds;
      if (into >= lengthSeconds) stop();
      else setPlayed(lengthSeconds > 0 ? into / lengthSeconds : 0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", stop);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", stop);
      audio.pause();
      if (playing.stop === stop) playing.stop = undefined;
      player.current = undefined;
    };
  }, [url, startSeconds, lengthSeconds]);

  const toggle = () => {
    const audio = player.current;
    if (audio === undefined) return;
    if (isPlaying) {
      audio.pause();
      setPlaying(false);
      return;
    }
    playing.stop?.();
    playing.stop = () => {
      audio.pause();
      setPlaying(false);
    };
    if (audio.currentTime < startSeconds || played === 0) {
      audio.currentTime = startSeconds;
    }
    setPlaying(true);
    audio.play().catch(() => {
      setPlaying(false);
    });
  };

  return { isReady: url !== undefined, isPlaying, played, toggle, url };
}
