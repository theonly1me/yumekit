import type { Chat } from "../chat/useChat.js";
import type { EngineClient } from "../engine/engineClient.js";
import { Sheet } from "../sheets/Sheet.js";
import { AgentPane } from "../side/agent/AgentPane.js";
import { ToolsPane } from "../tools/ToolsPane.js";
import { AiGroup } from "./AiGroup.js";
import { LimitsGroup } from "./LimitsGroup.js";
import "./settings.css";

export function SettingsSheet(props: {
  client: EngineClient;
  chat: Chat;
  projectFolder: string;
  openServerId: string | undefined;
  onOpenServer: (serverId: string | undefined) => void;
  onClose: () => void;
}) {
  return (
    <Sheet titleId="settings-title" onClose={props.onClose}>
      <div className="sheet-body">
        <h2 id="settings-title">Settings</h2>
        <AiGroup client={props.client} chat={props.chat} />
        <section className="setting-group" aria-labelledby="tools-title">
          <h3 id="tools-title">Media tools and keys</h3>
          <ToolsPane
            client={props.client}
            openServerId={props.openServerId}
            onOpenServer={props.onOpenServer}
          />
        </section>
        <LimitsGroup client={props.client} />
        <section className="setting-group" aria-labelledby="agent-title">
          <h3 id="agent-title">Use an agent in your own terminal</h3>
          <AgentPane
            client={props.client}
            projectFolder={props.projectFolder}
          />
        </section>
      </div>
    </Sheet>
  );
}
