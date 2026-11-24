import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { changeProject } from "../../scenes/directChange.js";
import { PlayButton } from "../sound/PlayButton.js";
import { StatusLine } from "../sound/StatusLine.js";
import type { SoundStatus } from "../sound/useSoundActions.js";
import { musicFactsOf } from "./musicFacts.js";

function fitText(fit: number): string {
  const share = Math.max(0, Math.round(fit * 100));
  return `Follows the story ${String(share)} of 100`;
}

export function CheckedMusicGroup(props: {
  client: EngineClient;
  snapshot: Snapshot;
  locked: boolean;
}) {
  const { client, snapshot } = props;
  const [status, setStatus] = useState<SoundStatus>({ kind: "idle" });
  const checks = snapshot.bible.storyPlan?.musicChecks ?? [];
  if (checks.length === 0) return null;
  const inUse = musicFactsOf(snapshot).asset?.id;
  const { framesPerSecond } = snapshot.project;
  const use = (check: { assetId: string; startSeconds: number }) => {
    setStatus({ kind: "working", text: "Putting this music in the video." });
    changeProject({
      client,
      name: "replace_music",
      input: { asset_id: check.assetId, start_seconds: check.startSeconds },
    })
      .then((outcome) => {
        setStatus(
          outcome.kind === "done"
            ? { kind: "done", text: "The video has this music now." }
            : { kind: "failed", text: outcome.message },
        );
      })
      .catch((error: unknown) => {
        setStatus({ kind: "failed", text: String(error) });
      });
  };
  return (
    <section className="part-group" aria-labelledby="checked-music">
      <h4 id="checked-music">Music made for the story</h4>
      <p className="fact">
        The best fit to the rise and fall of the story is first. Listen, and
        pick the one you like.
      </p>
      <ol className="checked-music">
        {checks.map((check) => {
          const asset = snapshot.assets.find(
            (candidate) => candidate.id === check.assetId,
          );
          const lengthSeconds =
            (asset?.durationFrames ?? 0) / framesPerSecond - check.startSeconds;
          return (
            <li key={check.assetId} className="sound-track">
              <PlayButton
                client={client}
                piece={{
                  assetId: check.assetId,
                  startSeconds: check.startSeconds,
                  lengthSeconds: Math.max(0, lengthSeconds),
                }}
                label={asset?.label ?? check.assetId}
              />
              <span className="track-name">
                {asset?.label ?? check.assetId}
              </span>
              <span className="fact">{fitText(check.fit)}</span>
              {check.warnings.length === 0 ? null : (
                <span className="fact checked-music-warnings">
                  {check.warnings.join(" ")}
                </span>
              )}
              <button
                type="button"
                disabled={
                  props.locked ||
                  status.kind === "working" ||
                  inUse === check.assetId
                }
                onClick={() => {
                  use(check);
                }}
              >
                {inUse === check.assetId ? "In your video" : "Use this"}
              </button>
            </li>
          );
        })}
      </ol>
      <StatusLine status={status} />
    </section>
  );
}
