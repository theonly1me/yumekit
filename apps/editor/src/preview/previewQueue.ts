export type PreviewReply =
  | { type: "ready"; frameCount: number }
  | { type: "sought"; requestId: number }
  | {
      type: "failed";
      requestId: number;
      kind: string;
      message: string;
      sceneId?: string | undefined;
    };

export interface PreviewFailure {
  frame: number;
  kind: string;
  message: string;
  sceneId?: string | undefined;
}

export interface SeekMessage {
  type: "seek";
  frame: number;
  requestId: number;
}

export interface PreviewQueue {
  show: (frame: number) => void;
  receive: (reply: PreviewReply) => void;
}

export function createPreviewQueue(options: {
  send: (message: SeekMessage) => void;
  onFailure: (failure: PreviewFailure | undefined) => void;
}): PreviewQueue {
  let isReady = false;
  let wantedFrame: number | undefined;
  let drawnFrame: number | undefined;
  let lastRequest: SeekMessage | undefined;
  let waitingFor: SeekMessage | undefined;
  let nextRequestId = 1;
  let isRedrawFailed = false;

  function sendWanted(): void {
    if (!isReady || waitingFor !== undefined || wantedFrame === undefined) {
      return;
    }
    if (wantedFrame === drawnFrame) return;
    waitingFor = { type: "seek", frame: wantedFrame, requestId: nextRequestId };
    nextRequestId += 1;
    options.send(waitingFor);
  }

  function finish(reply: PreviewReply): void {
    if (reply.type === "ready") return;
    const answered =
      waitingFor?.requestId === reply.requestId ? waitingFor : lastRequest;
    if (answered?.requestId !== reply.requestId) return;
    if (waitingFor === answered) {
      waitingFor = undefined;
      lastRequest = answered;
      drawnFrame = answered.frame;
    } else {
      isRedrawFailed = reply.type === "failed";
    }
    options.onFailure(
      reply.type === "failed"
        ? {
            frame: answered.frame,
            kind: reply.kind,
            message: reply.message,
            sceneId: reply.sceneId,
          }
        : undefined,
    );
  }

  return {
    show: (frame) => {
      wantedFrame = frame;
      sendWanted();
    },
    receive: (reply) => {
      if (reply.type === "ready") {
        isReady = true;
        if (!isRedrawFailed) options.onFailure(undefined);
        isRedrawFailed = false;
      }
      finish(reply);
      sendWanted();
    },
  };
}
