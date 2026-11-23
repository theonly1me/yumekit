import { useRef, useState } from "react";
import { z } from "zod";
import { progressLineOf } from "../../chat/stepLines.js";
import type { EngineClient } from "../../engine/engineClient.js";
import { useEngineEvents } from "../../engine/useEngineEvents.js";
import { failureTextOf } from "../../tools/requestText.js";
import type { ChoiceService } from "./mediaChoices.js";

const localServers = new Set(["local-voice"]);
const freeLine = "Free. It runs on your computer.";

type GetState =
  | { kind: "idle" }
  | { kind: "getting"; line: string }
  | { kind: "failed"; message: string };

export function megabytesText(bytes: number): string {
  return `${String(Math.round(bytes / 1_000_000))} MB`;
}

function waitingDownloadOf(service: ChoiceService) {
  return service.models.find((model) => model.download?.ready === false);
}

export function ServiceLine(props: {
  client: EngineClient;
  service: ChoiceService;
}) {
  const { client, service } = props;
  const [state, setState] = useState<GetState>({ kind: "idle" });
  const callId = useRef<string>(undefined);
  useEngineEvents({
    client,
    onEvent: (event) => {
      if (event.type !== "call-progress" || event.callId !== callId.current)
        return;
      const line = progressLineOf(event);
      if (line !== undefined) setState({ kind: "getting", line });
    },
  });
  const waiting = waitingDownloadOf(service);
  const hasDownload = service.models.some((model) => model.download !== null);
  if (!localServers.has(service.server) && !hasDownload) return undefined;
  const size = waiting?.download?.bytes;
  const getNow = () => {
    const id = crypto.randomUUID();
    callId.current = id;
    setState({ kind: "getting", line: "Getting it now" });
    client
      .readJson({
        path: "/api/media/prepare",
        method: "POST",
        schema: z.object({ ready: z.boolean() }),
        body: { server: service.server, model: waiting?.id, callId: id },
      })
      .then((reply) => {
        setState(
          reply.ok
            ? { kind: "idle" }
            : { kind: "failed", message: failureTextOf(reply.failure) },
        );
      })
      .catch((error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      });
  };
  return (
    <div className="service-line">
      <p className="fact">
        {size === undefined
          ? freeLine
          : `${freeLine} One download of ${megabytesText(size)}.`}
      </p>
      {waiting === undefined ? undefined : state.kind === "getting" ? (
        <p className="fact" role="status">
          {state.line}
        </p>
      ) : (
        <button type="button" onClick={getNow}>
          Get it now
        </button>
      )}
      {state.kind === "failed" ? (
        <p className="change-failure" role="alert">
          {state.message}
        </p>
      ) : undefined}
    </div>
  );
}
