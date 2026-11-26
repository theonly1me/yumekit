import type { Chat } from "../chat/useChat.js";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { Sheet } from "../sheets/Sheet.js";
import { AgentPane } from "../side/agent/AgentPane.js";
import { ToolsPane } from "../tools/ToolsPane.js";
import { AiGroup } from "./AiGroup.js";
import { ApprovePicturesRow } from "./ApprovePicturesRow.js";
import { AiModels } from "./aiModels/AiModels.js";
import type { VideoStyleId } from "../videoStyle/videoStyles.js";
import { CalmRow } from "./CalmRow.js";
import { ChecksRow } from "./ChecksRow.js";
import { LeadAccessGroup } from "./leadAccess/LeadAccessGroup.js";
import { LimitsGroup } from "./limits/LimitsGroup.js";
import { LookRow } from "./LookRow.js";
import { ServicesGroup } from "./services/index.js";
import { VideoStyleGroup } from "./VideoStyleGroup.js";
import { BetweenScenesRow } from "./BetweenScenesRow.js";
import { MoreSettings } from "./MoreSettings.js";
import { ThemeRow } from "./ThemeRow.js";
import "./settings.css";

export function SettingsSheet(props: {
  client: EngineClient;
  chat: Chat;
  snapshot: Snapshot;
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
        <AiGroup client={props.client} chat={props.chat} />
        <LeadAccessGroup client={props.client} agent={props.chat.agent} />
        <LimitsGroup client={props.client} />
        <ThemeRow />
        <MoreSettings isOpenAtStart={props.openServerId !== undefined}>
          <VideoStyleGroup client={props.client} videoStyle={props.videoStyle}>
            <LookRow client={props.client} look={props.look} />
            <CalmRow
              client={props.client}
              calm={props.snapshot.project.calm === true}
            />
            <BetweenScenesRow client={props.client} snapshot={props.snapshot} />
            <ApprovePicturesRow
              client={props.client}
              isOn={props.snapshot.project.approvePicturesFirst !== false}
            />
            <ChecksRow
              client={props.client}
              checks={props.snapshot.project.checks}
            />
            <AiModels
              client={props.client}
              agentId={props.chat.agent?.id}
              roles={["critic"]}
            />
          </VideoStyleGroup>
          <ServicesGroup client={props.client} />
          <section className="setting-group" aria-labelledby="tools-title">
            <h3 id="tools-title">Media tools and keys</h3>
            <ToolsPane
              client={props.client}
              openServerId={props.openServerId}
              onOpenServer={props.onOpenServer}
            />
          </section>
          <section className="setting-group" aria-labelledby="agent-title">
            <h3 id="agent-title">Use an agent in your own terminal</h3>
            <AgentPane
              client={props.client}
              projectFolder={props.projectFolder}
            />
          </section>
        </MoreSettings>
      </div>
    </Sheet>
  );
}
