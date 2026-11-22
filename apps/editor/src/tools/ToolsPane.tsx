import type { EngineClient } from "../engine/engineClient.js";
import { ServerDetail } from "./ServerDetail.js";
import { serverRowsOf, stateTextOf, type ServerRow } from "./serverFacts.js";
import { useMediaServers } from "./useMediaServers.js";
import "./tools.css";

function isRowReady(row: ServerRow): boolean {
  return row.kind === "started" && row.keyState !== "missing";
}

function rowNote(row: ServerRow): string {
  if (row.kind === "failed") return "Set up in media-tools.json";
  return row.runs === undefined ? row.makes : `${row.makes}. ${row.runs}`;
}

export function ToolsPane(props: {
  client: EngineClient;
  openServerId: string | undefined;
  onOpenServer: (serverId: string | undefined) => void;
}) {
  const { state, requests } = useMediaServers(props.client);
  return (
    <>
      <p className="fact">
        Each tool makes pictures, voice, music, or video with your own account.
        Pick a tool to add its key.
      </p>
      {state.kind === "loading" ? (
        <p className="fact">Reading the media tools.</p>
      ) : undefined}
      {state.kind === "failed" ? (
        <p className="failure" role="alert">
          {state.message}
        </p>
      ) : undefined}
      {state.kind === "ready" ? (
        <ul className="server-list" aria-label="Media tools">
          {serverRowsOf(state.servers).map((row) => {
            const isOpen = row.id === props.openServerId;
            return (
              <li key={row.id} className="server" data-ready={isRowReady(row)}>
                <button
                  type="button"
                  className="server-head"
                  aria-expanded={isOpen}
                  onClick={() => {
                    props.onOpenServer(isOpen ? undefined : row.id);
                  }}
                >
                  <span className="server-name">
                    {row.label}
                    <em>{rowNote(row)}</em>
                  </span>
                  <span className="server-state">{stateTextOf(row)}</span>
                </button>
                {isOpen ? (
                  <ServerDetail row={row} requests={requests} />
                ) : undefined}
              </li>
            );
          })}
        </ul>
      ) : undefined}
      <div className="group">
        <h4>Add another tool</h4>
        <p className="fact">
          Another media tool server that makes pictures, voice, music, or video
          also works. Put it in <strong>media-tools.json</strong> of the
          project, then run <strong>yumekit open</strong> again.
        </p>
      </div>
    </>
  );
}
