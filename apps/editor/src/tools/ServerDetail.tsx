import { useState } from "react";
import { KeyGuide } from "./KeyGuide.js";
import type { MediaServer } from "./mediaServers.js";
import { failureTextOf, type KeyRequests } from "./requestText.js";
import { keyStateOf, type ServerRow } from "./serverFacts.js";

type CheckState =
  | { kind: "idle" }
  | { kind: "busy"; action: "test" | "remove" }
  | { kind: "done"; valid: boolean; message: string }
  | { kind: "failed"; message: string };

function KeyActions(props: {
  server: MediaServer;
  requests: KeyRequests;
  canRemove: boolean;
}) {
  const { server, requests } = props;
  const [state, setState] = useState<CheckState>({ kind: "idle" });
  const isBusy = state.kind === "busy";

  const test = async () => {
    setState({ kind: "busy", action: "test" });
    const checked = await requests.checkKey(server.server);
    setState(
      checked.ok
        ? { kind: "done", ...checked.value }
        : { kind: "failed", message: failureTextOf(checked.failure) },
    );
  };
  const remove = async () => {
    setState({ kind: "busy", action: "remove" });
    for (const key of server.keys) {
      if (key.source !== "key-file") continue;
      const removed = await requests.removeKey(key.variable);
      if (!removed.ok) {
        setState({ kind: "failed", message: failureTextOf(removed.failure) });
        return;
      }
    }
    setState({ kind: "idle" });
  };
  const run = (action: () => Promise<void>) => () => {
    action().catch((error: unknown) => {
      setState({ kind: "failed", message: String(error) });
    });
  };

  return (
    <>
      <div className="key-actions">
        <button type="button" disabled={isBusy} onClick={run(test)}>
          {state.kind === "busy" && state.action === "test"
            ? "Testing the key"
            : "Test the key"}
        </button>
        {props.canRemove ? (
          <button type="button" disabled={isBusy} onClick={run(remove)}>
            Remove the key
          </button>
        ) : undefined}
      </div>
      <p className="fact" role="status">
        {state.kind === "done" ? (
          <>
            <strong>
              {state.valid ? "The key works." : "The key does not work."}
            </strong>{" "}
            {state.message}
          </>
        ) : undefined}
      </p>
      {state.kind === "failed" ? (
        <p className="failure" role="alert">
          {state.message}
        </p>
      ) : undefined}
    </>
  );
}

function StartedDetail(props: { server: MediaServer; requests: KeyRequests }) {
  const { server, requests } = props;
  const state = keyStateOf(server);
  const missing = server.keys.filter((key) => key.source === "missing");
  const [firstMissing] = missing;
  if (firstMissing !== undefined) {
    return (
      <KeyGuide
        serverId={server.server}
        mediaKey={firstMissing}
        requests={requests}
      />
    );
  }
  if (state === "no-key") {
    return (
      <div className="key-guide">
        <p className="fact">
          {server.runs === "on-this-computer"
            ? "This tool runs on this computer and needs no key."
            : "This tool needs no key."}
        </p>
      </div>
    );
  }
  const names = server.keys.map((key) => key.label).join(" and ");
  return (
    <div className="key-guide">
      <p className="fact">
        {state === "environment" ? (
          <>
            yumekit reads{" "}
            <strong>
              {server.keys.map((key) => key.variable).join(" and ")}
            </strong>{" "}
            from your shell.
          </>
        ) : (
          <>
            <strong>{names}</strong> is saved on this computer.
          </>
        )}
      </p>
      <KeyActions
        key={state}
        server={server}
        requests={requests}
        canRemove={state === "key-file"}
      />
    </div>
  );
}

export function ServerDetail(props: { row: ServerRow; requests: KeyRequests }) {
  const { row } = props;
  if (row.kind === "failed") {
    return (
      <div className="key-guide">
        <p className="fact">
          This tool failed to start. <strong>{row.message}</strong>
        </p>
        <p className="fact">
          Check its entry in <strong>media-tools.json</strong>, then run{" "}
          <strong>yumekit open</strong> again.
        </p>
      </div>
    );
  }
  return <StartedDetail server={row.server} requests={props.requests} />;
}
