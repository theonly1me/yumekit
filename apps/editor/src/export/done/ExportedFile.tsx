import { useState, type ReactNode } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { failureTextOf } from "../../tools/requestText.js";
import type { MadeFile } from "../exportJobs.js";
import { linesText } from "../fileSize/fileSizeChoice.js";
import { openVideoFile, type OpenOutcome } from "../openVideoFile.js";
import { revealExport } from "./exportRequests.js";
import { revealLabelOf, revealPlaceOf, sizeTextOf } from "./exportWords.js";
import "./exportedFile.css";

function openMessageOf(outcome: OpenOutcome): ReactNode {
  if (outcome.kind === "opened") return undefined;
  if (outcome.kind === "too-large") {
    return "The file is too large to play here. Open it from its folder in your video player.";
  }
  if (outcome.kind === "failed") return outcome.message;
  return (
    <>
      The browser blocked the new tab.{" "}
      <a href={outcome.url} target="_blank" rel="noreferrer">
        Play the video
      </a>
    </>
  );
}

function factsOf(made: MadeFile): string {
  const size = made.bytes === undefined ? [] : [sizeTextOf(made.bytes)];
  const lines =
    made.shortSidePixels === undefined ? [] : [linesText(made.shortSidePixels)];
  const kind = made.isSharper ? ["Sharper copy"] : [];
  return [...kind, ...size, ...lines].join(", ");
}

export function ExportedFile(props: { client: EngineClient; made: MadeFile }) {
  const { client, made } = props;
  const [message, setMessage] = useState<ReactNode>();
  const say = (text: ReactNode) => {
    setMessage(text);
  };
  const facts = factsOf(made);
  return (
    <div className="exported-file" data-sharper={made.isSharper}>
      <p className="exported-name">
        <strong>{made.fileName}</strong>
        {facts === "" ? undefined : <span>{facts}</span>}
      </p>
      <p className="exported-path">
        <span className="hidden-label">Full path: </span>
        <code>{made.file}</code>
        <button
          type="button"
          className="link"
          onClick={() => {
            navigator.clipboard.writeText(made.file).then(
              () => {
                say("The path is copied.");
              },
              () => {
                say("Select the path and copy it.");
              },
            );
          }}
        >
          Copy
        </button>
      </p>
      <div className="exported-actions">
        <button
          type="button"
          onClick={() => {
            say(undefined);
            openVideoFile({ client, served: made.served })
              .then((outcome) => {
                say(openMessageOf(outcome));
              })
              .catch((error: unknown) => {
                say(String(error));
              });
          }}
        >
          Play
        </button>
        <button
          type="button"
          onClick={() => {
            say(undefined);
            revealExport({ client, path: made.file })
              .then((revealed) => {
                say(revealed.ok ? undefined : failureTextOf(revealed.failure));
              })
              .catch((error: unknown) => {
                say(String(error));
              });
          }}
        >
          {revealLabelOf(revealPlaceOf(navigator.userAgent))}
        </button>
      </div>
      {message === undefined ? undefined : (
        <p className="fact exported-note" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
