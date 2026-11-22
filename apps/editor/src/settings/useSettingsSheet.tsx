import { useState } from "react";
import type { Chat } from "../chat/useChat.js";
import type { EngineClient } from "../engine/engineClient.js";
import { SettingsSheet } from "./SettingsSheet.js";

export function useSettingsSheet(options: {
  client: EngineClient;
  chat: Chat;
  projectFolder: string;
}) {
  const [isOpen, setOpen] = useState(false);
  const [serverId, setServerId] = useState<string>();
  const sheet = isOpen ? (
    <SettingsSheet
      client={options.client}
      chat={options.chat}
      projectFolder={options.projectFolder}
      openServerId={serverId}
      onOpenServer={setServerId}
      onClose={() => {
        setOpen(false);
      }}
    />
  ) : undefined;
  return {
    isOpen,
    sheet,
    open: (openServerId: string | undefined) => {
      setServerId(openServerId);
      setOpen(true);
    },
  };
}
