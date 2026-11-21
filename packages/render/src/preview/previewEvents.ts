import type { ServerResponse } from "node:http";

export interface PreviewEvents {
  connect: (response: ServerResponse) => void;
  sendRefresh: (refreshCount: number) => void;
  close: () => void;
}

export function createPreviewEvents(): PreviewEvents {
  const responses = new Set<ServerResponse>();
  return {
    connect: (response) => {
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
      });
      response.flushHeaders();
      responses.add(response);
      response.on("close", () => responses.delete(response));
    },
    sendRefresh: (refreshCount) => {
      for (const response of responses) {
        response.write(`data: ${String(refreshCount)}\n\n`);
      }
    },
    close: () => {
      for (const response of responses) {
        response.end();
      }
      responses.clear();
    },
  };
}
