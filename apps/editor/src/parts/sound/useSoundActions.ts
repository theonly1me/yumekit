import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { changeProject } from "../../scenes/directChange.js";
import type { SoundPartName } from "../../sound/soundRowFacts.js";
import { failureTextOf } from "../../tools/requestText.js";
import { saveAssetFile } from "../files/saveAssetFile.js";
import {
  placeSoundFile,
  setMusicGain,
  type SoundChange,
} from "./soundChanges.js";

export type SoundStatus =
  | { kind: "idle" }
  | { kind: "working"; text: string }
  | { kind: "done"; text: string }
  | { kind: "failed"; text: string };

const doneTexts: Record<SoundPartName, (fileName: string) => string> = {
  voice: (fileName) => `The video now uses your recording ${fileName}.`,
  music: (fileName) => `The video now uses your music ${fileName}.`,
};

export function useSoundActions(options: {
  client: EngineClient;
  snapshot: Snapshot;
  part: SoundPartName;
}) {
  const { client, snapshot, part } = options;
  const [status, setStatus] = useState<SoundStatus>({ kind: "idle" });

  const run = (work: {
    workingText: string;
    doneText: string;
    change: () => Promise<SoundChange>;
  }) => {
    setStatus({ kind: "working", text: work.workingText });
    work
      .change()
      .then((outcome) => {
        setStatus(
          outcome.kind === "done"
            ? { kind: "done", text: work.doneText }
            : { kind: "failed", text: outcome.message },
        );
      })
      .catch((error: unknown) => {
        setStatus({ kind: "failed", text: String(error) });
      });
  };

  return {
    status,
    isWorking: status.kind === "working",
    takeFile: (file: File) => {
      run({
        workingText: `Adding ${file.name}.`,
        doneText: doneTexts[part](file.name),
        change: async () => {
          const actId = crypto.randomUUID();
          const uploaded = await client.upload({ file, actId });
          if (!uploaded.ok) {
            return { kind: "failed", message: failureTextOf(uploaded.failure) };
          }
          return placeSoundFile({
            client,
            snapshot,
            part,
            asset: uploaded.value.asset,
            actId,
          });
        },
      });
    },
    download: (assetIds: string[]) => {
      run({
        workingText: "Saving the sound file.",
        doneText:
          assetIds.length === 1
            ? "The sound file is in your downloads."
            : `${String(assetIds.length)} sound files are in your downloads.`,
        change: async () => {
          for (const assetId of assetIds) {
            const saved = await saveAssetFile({ client, assetId });
            if (saved.kind === "failed") return saved;
          }
          return { kind: "done" };
        },
      });
    },
    switchTrack: (change: { trackId: string; off: boolean }) => {
      run({
        workingText: change.off ? "Removing the sound." : "Putting it back.",
        doneText: change.off
          ? "The video plays without it now."
          : "The video plays it again.",
        change: () =>
          changeProject({
            client,
            name: "set_track_off",
            input: { track_id: change.trackId, off: change.off },
          }),
      });
    },
    setGain: (gainDecibels: number) => {
      run({
        workingText: "Changing how loud the music is.",
        doneText: "The music has the new volume.",
        change: () => setMusicGain({ client, snapshot, gainDecibels }),
      });
    },
  };
}
