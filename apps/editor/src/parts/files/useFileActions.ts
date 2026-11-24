import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { changeProject } from "../../scenes/directChange.js";
import { failureTextOf } from "../../tools/requestText.js";
import { sendFixedRequest, type AskTheAi } from "../fixedRequests.js";
import { notSentText } from "../frame/stepViewProps.js";
import type { SoundStatus } from "../sound/useSoundActions.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { lookFontInput } from "./fontChoice.js";
import { saveAssetFile } from "./saveAssetFile.js";

type Work = Promise<{ kind: "done" } | { kind: "failed"; message: string }>;

const tooLargeText =
  "This file is larger than 500 megabytes. Pick a smaller file.";

export function useFileActions(options: {
  client: EngineClient;
  ask: AskTheAi;
}) {
  const { client } = options;
  const [status, setStatus] = useState<SoundStatus>({ kind: "idle" });

  const run = (work: {
    workingText: string;
    doneText: string;
    change: () => Work;
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
    add: (file: File) => {
      run({
        workingText: `Adding ${file.name}.`,
        doneText: `${file.name} is in the project now.`,
        change: async () => {
          const uploaded = await client.upload({ file });
          if (uploaded.ok) return { kind: "done" };
          const { failure } = uploaded;
          const isTooLarge =
            failure.kind === "request-failed" &&
            failure.engineKind === "upload-too-large";
          return {
            kind: "failed",
            message: isTooLarge ? tooLargeText : failureTextOf(failure),
          };
        },
      });
    },
    download: (file: { assetId: string; name: string }) => {
      run({
        workingText: `Saving ${file.name}.`,
        doneText: `${file.name} is in your downloads.`,
        change: async () => {
          const saved = await saveAssetFile({ client, assetId: file.assetId });
          return saved.kind === "saved" ? { kind: "done" } : saved;
        },
      });
    },
    remove: (file: { assetId: string; name: string }) => {
      run({
        workingText: `Removing ${file.name}.`,
        doneText: `${file.name} is no longer in the project. Undo brings it back.`,
        change: () =>
          changeProject({
            client,
            name: "remove_asset",
            input: { asset_id: file.assetId },
          }),
      });
    },
    useFont: (font: { snapshot: Snapshot; assetId: string; name: string }) => {
      const input = lookFontInput({
        snapshot: font.snapshot,
        assetId: font.assetId,
        fileName: font.name,
      });
      run({
        workingText: `Setting ${font.name} as the font of the video.`,
        doneText: `The text of the video uses ${input.look_font} now. Undo goes back.`,
        change: () => changeProject({ client, name: "set_fonts", input }),
      });
    },
    useInVideo: (fileName: string) => {
      sendFixedRequest({
        ask: options.ask,
        request: { kind: "use-my-file", fileName },
      })
        .then((isSent) => {
          if (!isSent) setStatus({ kind: "failed", text: notSentText });
        })
        .catch((error: unknown) => {
          setStatus({ kind: "failed", text: String(error) });
        });
    },
  };
}
