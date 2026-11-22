import { useEffect, useRef, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output, Snapshot } from "../engine/snapshot.js";
import { clockText } from "../timeline/clock.js";
import type { PreviewFailure } from "./previewQueue.js";
import { useFitScale } from "./useFitScale.js";
import { usePreviewChannel } from "./usePreviewChannel.js";
import { useTextInPlace } from "./useTextInPlace.js";

type PageState =
  | { outputId: string; kind: "loaded"; pageUrl: string }
  | { outputId: string; kind: "failed"; message: string };

function failureText(options: {
  failure: PreviewFailure;
  framesPerSecond: number;
}): string {
  const { failure, framesPerSecond } = options;
  const time = clockText({ frame: failure.frame, framesPerSecond });
  const where =
    failure.sceneId === undefined
      ? `The video did not draw at ${time}`
      : `The scene "${failure.sceneId}" did not draw at ${time}`;
  return `${where}. ${failure.message}`;
}

function usePageState(options: { client: EngineClient; outputId: string }) {
  const { client, outputId } = options;
  const [page, setPage] = useState<PageState>();

  useEffect(() => {
    let isCurrent = true;
    client
      .preview(outputId)
      .then((reply) => {
        if (!isCurrent) return;
        setPage(
          reply.ok
            ? { outputId, kind: "loaded", pageUrl: reply.value.pageUrl }
            : {
                outputId,
                kind: "failed",
                message:
                  reply.failure.kind === "request-failed"
                    ? reply.failure.message
                    : "The preview did not load.",
              },
        );
      })
      .catch((error: unknown) => {
        setPage({ outputId, kind: "failed", message: String(error) });
      });
    return () => {
      isCurrent = false;
    };
  }, [client, outputId]);

  return page?.outputId === outputId ? page : undefined;
}

export function Preview(props: {
  client: EngineClient;
  output: Output;
  frame: number;
  framesPerSecond: number;
  hint: string;
  snapshot: Snapshot;
  onTextEditing: () => void;
}) {
  const { client, output, frame } = props;
  const textInPlace = useTextInPlace({
    client,
    snapshot: props.snapshot,
    onEditing: props.onTextEditing,
  });
  const page = usePageState({ client, outputId: output.id });
  const pageUrl = page?.kind === "loaded" ? page.pageUrl : undefined;
  const frameElement = useRef<HTMLIFrameElement>(null);
  const failure = usePreviewChannel({
    pageUrl,
    frame,
    frameElement,
    textInPlace,
  });
  const { stageRef, scale } = useFitScale(output);
  const failureLine =
    failure === undefined
      ? page?.kind === "failed"
        ? page.message
        : undefined
      : failureText({ failure, framesPerSecond: props.framesPerSecond });
  const shownFailure = textInPlace.failure ?? failureLine;

  return (
    <>
      <div
        className="frame-area"
        id="preview-area"
        role="tabpanel"
        aria-label="Preview"
        data-tall={output.heightPixels > output.widthPixels}
        ref={stageRef}
      >
        <div
          className="frame"
          data-output={output.id}
          style={{
            width: output.widthPixels * scale,
            height: output.heightPixels * scale,
          }}
        >
          {pageUrl === undefined ? undefined : (
            <iframe
              ref={frameElement}
              key={pageUrl}
              src={pageUrl}
              title="Preview of the video"
              tabIndex={-1}
              sandbox="allow-scripts allow-same-origin"
              style={{
                width: output.widthPixels,
                height: output.heightPixels,
                transform: `scale(${String(scale)})`,
              }}
            />
          )}
        </div>
      </div>
      <p className="frame-hint">{props.hint}</p>
      {shownFailure === undefined ? undefined : (
        <p className="preview-failure" role="status">
          {shownFailure}
        </p>
      )}
    </>
  );
}
