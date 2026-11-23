import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { useMediaServers } from "../../tools/useMediaServers.js";
import type { SoundStatus } from "../sound/useSoundActions.js";
import { StatusLine } from "../sound/StatusLine.js";
import {
  localMusicPickOf,
  makeLocalMusic,
  musicStylesOf,
  newSeedOf,
  videoSecondsOf,
  type MusicStyle,
} from "./localMusic.js";
import "./localMusic.css";

export function LocalMusicGroup(props: {
  client: EngineClient;
  snapshot: Snapshot;
  locked: boolean;
}) {
  const { client, snapshot } = props;
  const { state } = useMediaServers(client);
  const [status, setStatus] = useState<SoundStatus>({ kind: "idle" });
  if (state.kind !== "ready") return null;
  const styles = musicStylesOf(state.servers);
  if (styles.length === 0) return null;
  const current = localMusicPickOf(snapshot);
  const hasVideo = videoSecondsOf(snapshot) > 0;
  const isWorking = status.kind === "working";
  const isOff = props.locked || isWorking || !hasVideo;
  const make = (options: { style: MusicStyle; seed: number }) => {
    setStatus({
      kind: "working",
      text: `Making ${options.style.label} music.`,
    });
    makeLocalMusic({ client, snapshot, ...options })
      .then((outcome) => {
        setStatus(
          outcome.kind === "done"
            ? {
                kind: "done",
                text: `The video now has ${options.style.label} music.`,
              }
            : { kind: "failed", text: outcome.message },
        );
      })
      .catch((error: unknown) => {
        setStatus({ kind: "failed", text: String(error) });
      });
  };
  const currentStyle = styles.find((style) => style.choice === current?.style);
  return (
    <section className="part-group" aria-labelledby="local-music-title">
      <h4 id="local-music-title">Music from this computer</h4>
      <p className="fact">
        {hasVideo
          ? "Free, with no key. Pick a style. The music fits the length of the video."
          : "Free, with no key. Make the video first, then pick a style that fits its length."}
      </p>
      <ul className="sound-list" aria-label="Styles of music">
        {styles.map((style) => {
          const isCurrent = style.choice === current?.style;
          return (
            <li key={style.choice} className="sound-item style-item">
              <span className="sound-words">
                <span className="style-name">
                  {style.label}
                  {style.approved ? undefined : (
                    <span className="waiting-note">Not approved yet</span>
                  )}
                </span>
                <span className="fact">{style.line}</span>
              </span>
              <button
                type="button"
                aria-pressed={isCurrent}
                disabled={isOff || isCurrent}
                onClick={() => {
                  make({ style, seed: 1 });
                }}
              >
                {isCurrent ? "In use" : "Use this"}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="part-actions">
        <button
          type="button"
          disabled={isOff || currentStyle === undefined}
          onClick={() => {
            if (currentStyle === undefined) return;
            make({ style: currentStyle, seed: newSeedOf(current?.seed) });
          }}
        >
          Try another
        </button>
        {currentStyle === undefined ? (
          <span className="fact">Pick a style first.</span>
        ) : (
          <span className="fact">Another version of {currentStyle.label}.</span>
        )}
      </div>
      <StatusLine status={status} />
    </section>
  );
}
