import { useEffect, useRef, useState, type RefObject } from "react";
import {
  createPreviewQueue,
  type PreviewFailure,
  type PreviewQueue,
} from "./previewQueue.js";
import { previewReplyOf } from "./previewReply.js";

export function usePreviewChannel(options: {
  pageUrl: string | undefined;
  frame: number;
  frameElement: RefObject<HTMLIFrameElement | null>;
}): PreviewFailure | undefined {
  const { pageUrl, frame, frameElement } = options;
  const [failure, setFailure] = useState<{
    pageUrl: string;
    failure: PreviewFailure;
  }>();
  const queue = useRef<PreviewQueue>(undefined);
  const latestFrame = useRef(frame);

  useEffect(() => {
    latestFrame.current = frame;
    queue.current?.show(frame);
  }, [frame]);

  useEffect(() => {
    if (pageUrl === undefined) return;
    const pageOrigin = new URL(pageUrl).origin;
    const created = createPreviewQueue({
      send: (message) => {
        frameElement.current?.contentWindow?.postMessage(message, pageOrigin);
      },
      onFailure: (found) => {
        setFailure(
          found === undefined ? undefined : { pageUrl, failure: found },
        );
      },
    });
    created.show(latestFrame.current);
    queue.current = created;
    const listen = (event: MessageEvent) => {
      if (
        event.origin !== pageOrigin ||
        event.source !== frameElement.current?.contentWindow
      ) {
        return;
      }
      const reply = previewReplyOf(event.data);
      if (reply !== undefined) created.receive(reply);
    };
    window.addEventListener("message", listen);
    return () => {
      window.removeEventListener("message", listen);
      queue.current = undefined;
    };
  }, [pageUrl, frameElement]);

  return failure !== undefined && failure.pageUrl === pageUrl
    ? failure.failure
    : undefined;
}
