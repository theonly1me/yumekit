import { useEffect, useRef, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Output } from "../engine/snapshot.js";
import type { PreviewFailure } from "./previewQueue.js";
import { useFitScale } from "./useFitScale.js";
import { usePreviewChannel } from "./usePreviewChannel.js";

type PageState =
  | { outputId: string; kind: "loaded"; pageUrl: string }
  | { outputId: string; kind: "failed"; message: string };

function failureText(failure: PreviewFailure): string {
  const where =
    failure.sceneId === undefined
      ? `Frame ${String(failure.frame)} did not draw`
      : `The scene "${failure.sceneId}" did not draw at frame ${String(failure.frame)}`;
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
}) {
  const { client, output, frame } = props;
  const page = usePageState({ client, outputId: output.id });
  const pageUrl = page?.kind === "loaded" ? page.pageUrl : undefined;
  const frameElement = useRef<HTMLIFrameElement>(null);
  const failure = usePreviewChannel({ pageUrl, frame, frameElement });
  const { stageRef, scale } = useFitScale(output);
  const failureLine =
    failure === undefined
      ? page?.kind === "failed"
        ? page.message
        : undefined
      : failureText(failure);

  return (
    <div className="stage" ref={stageRef}>
      <div
        className="preview"
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
            title="Preview of the current frame"
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
      {failureLine === undefined ? undefined : (
        <p className="preview-failure" role="status">
          {failureLine}
        </p>
      )}
    </div>
  );
}
