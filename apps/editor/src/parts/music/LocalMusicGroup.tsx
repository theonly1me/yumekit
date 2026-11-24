import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { useMediaServers } from "../../tools/useMediaServers.js";
import { useLeadMaking, type LeadPhase } from "../../lead/useLeadMaking.js";
import type { SoundStatus } from "../sound/useSoundActions.js";
import { StatusLine } from "../sound/StatusLine.js";
import {
  isMusicInUse,
  localMusicPickOf,
  musicRequestOf,
  musicStylesOf,
  newSeedOf,
  videoSecondsOf,
  type MusicStyle,
} from "./localMusic.js";
import "./localMusic.css";

function statusOf(phase: LeadPhase<string>): SoundStatus {
  switch (phase.kind) {
    case "editing":
      return { kind: "idle" };
    case "making":
      return { kind: "working", text: "The AI is making the music." };
    case "made":
      return { kind: "done", text: `The video now has ${phase.made} music.` };
    case "failed":
      return { kind: "failed", text: phase.failure.message };
  }
}

export function LocalMusicGroup(props: {
  client: EngineClient;
  snapshot: Snapshot;
  locked: boolean;
}) {
  const { client, snapshot } = props;
  const { state } = useMediaServers(client);
  const making = useLeadMaking<string>({ client });
  if (state.kind !== "ready") return null;
  const styles = musicStylesOf(state.servers);
  if (styles.length === 0) return null;
  const current = localMusicPickOf(snapshot);
  const hasVideo = videoSecondsOf(snapshot) > 0;
  const { phase, readiness } = making;
  const status = statusOf(phase);
  const isWorking = status.kind === "working";
  const isOff =
    props.locked || isWorking || !hasVideo || readiness.kind === "missing";
  const make = (options: { style: MusicStyle; seed: number }) => {
    const { assetId, request } = musicRequestOf({ snapshot, ...options });
    making.make({
      exact: request,
      find: (latest) =>
        isMusicInUse({ snapshot: latest, assetId })
          ? options.style.label
          : undefined,
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
      {readiness.kind === "missing" ? (
        <p className="fact">{readiness.message}</p>
      ) : undefined}
      <StatusLine status={status} />
    </section>
  );
}
