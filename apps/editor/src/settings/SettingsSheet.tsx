import type { Chat } from "../chat/useChat.js";
import type { EngineClient } from "../engine/engineClient.js";
import { Sheet } from "../sheets/Sheet.js";
import { AgentPane } from "../side/agent/AgentPane.js";
import { ToolsPane } from "../tools/ToolsPane.js";
import { AiGroup } from "./AiGroup.js";
import type { VideoStyleId } from "../videoStyle/videoStyles.js";
import { LimitsGroup } from "./LimitsGroup.js";
import { LookRow } from "./LookRow.js";
import { ServicesGroup } from "./services/index.js";
import { VideoStyleGroup } from "./VideoStyleGroup.js";
import "./settings.css";

export function SettingsSheet(props: {
  client: EngineClient;
  chat: Chat;
  projectFolder: string;
  videoStyle: VideoStyleId;
  look: string;
  openServerId: string | undefined;
  onOpenServer: (serverId: string | undefined) => void;
  onClose: () => void;
}) {
  return (
    <Sheet titleId="settings-title" onClose={props.onClose}>
      <div className="sheet-body">
        <h2 id="settings-title">Settings</h2>
        <VideoStyleGroup client={props.client} videoStyle={props.videoStyle}>
          <LookRow client={props.client} look={props.look} />
        </VideoStyleGroup>
        <AiGroup client={props.client} chat={props.chat} />
        <ServicesGroup client={props.client} />
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
