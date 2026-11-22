import type { EngineClient } from "../engine/engineClient.js";
import { AgentPane } from "./agent/AgentPane.js";

export function ChatPane(props: {
  client: EngineClient;
  projectFolder: string;
}) {
  return (
    <div className="chat-pane">
      <p className="chat-later">
        The chat with the AI comes in the next version. Until then, connect an
        agent in your own terminal.
      </p>
      <AgentPane client={props.client} projectFolder={props.projectFolder} />
    </div>
  );
}
