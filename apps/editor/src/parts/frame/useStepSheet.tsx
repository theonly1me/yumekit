import { useState } from "react";
import type { AskInput } from "../../chat/chatRequests.js";
import type { Chat } from "../../chat/useChat.js";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { Sheet } from "../../sheets/Sheet.js";
import type { SideTab } from "../../side/SidePanel.js";
import type { StepViewId } from "./stepViewProps.js";
import { StepView } from "./StepView.js";

export function useStepSheet(options: {
  client: EngineClient;
  snapshot: Snapshot;
  chat: Chat;
  onSideTab: (tab: SideTab) => void;
}) {
  const { chat } = options;
  const [openStepId, setOpenStepId] = useState<StepViewId>();
  const ask = (request: AskInput): Promise<boolean> => {
    options.onSideTab("chat");
    return chat.send(request);
  };
  const sheet =
    openStepId === undefined ? undefined : (
      <Sheet
        titleId={`step-view-${openStepId}`}
        onClose={() => {
          setOpenStepId(undefined);
        }}
      >
        <div className="sheet-body wide part-sheet">
          <StepView
            client={options.client}
            snapshot={options.snapshot}
            locked={chat.isRunning}
            ask={ask}
            stepId={openStepId}
            onStop={() => {
              chat.stop().catch(() => undefined);
            }}
          />
        </div>
      </Sheet>
    );
  return { isOpen: openStepId !== undefined, sheet, open: setOpenStepId };
}
