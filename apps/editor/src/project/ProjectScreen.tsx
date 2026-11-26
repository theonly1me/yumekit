import { useRef } from "react";
import { ChatPanel } from "../chat/ChatPanel.js";
import { assetUploadOf, usePendingFiles } from "../chat/files/index.js";
import { useChat } from "../chat/useChat.js";
import { useChatBox } from "../chat/useChatBox.js";
import { useRunningWork } from "../chat/running/useRunningWork.js";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { useExportSheet } from "../export/useExportSheet.js";
import { useSettingsSheet } from "../settings/useSettingsSheet.js";
import { ChatEdge } from "../side/ChatEdge.js";
import { ProjectBar } from "./bar/ProjectBar.js";
import { railStepsOf } from "./bar/railSteps.js";
import { shownStepOf, viewOfStep } from "./bar/stepViews.js";
import { MoneyFoot, openMoneyOf } from "./foot/MoneyFoot.js";
import { NextActionBar } from "./foot/NextActionBar.js";
import { ReadyLines } from "./ready/ReadyLines.js";
import { askForNotices } from "./ready/signals.js";
import { useProjectWork } from "./work/useProjectWork.js";
import { ChapterMenu, WorkBody } from "./work/WorkBody.js";
import "../side/chatEdge.css";
import "./project.css";

export function ProjectScreen(props: {
  client: EngineClient;
  snapshot: Snapshot;
  projectFolder: string;
  startFailure: string | undefined;
  onEditByHand: () => void;
}) {
  const { client, snapshot } = props;
  const chat = useChat(client);
  const box = useChatBox();
  const files = usePendingFiles({
    upload: assetUploadOf(client),
    onText: box.appendFileText,
  });
  const running = useRunningWork(client);
  const exporting = useExportSheet({
    client,
    snapshot,
    projectFolder: props.projectFolder,
    onShowScene: props.onEditByHand,
  });
  const settings = useSettingsSheet({
    client,
    chat,
    snapshot,
    projectFolder: props.projectFolder,
    videoStyle: snapshot.project.videoStyle ?? "graphics",
    look: snapshot.project.look ?? "paper",
  });
  const work = useProjectWork({
    client,
    snapshot,
    chat,
    startFailure: props.startFailure,
    onExport: exporting.open,
  });
  const { facts } = work;
  const hasAsked = useRef(false);
  const money = openMoneyOf(chat.entries);
  const sheet = [exporting, settings].find((each) => each.isOpen)?.sheet;
  return (
    <div className="project-screen">
      <div
        className="project"
        inert={sheet !== undefined}
        onPointerDownCapture={() => {
          if (hasAsked.current) return;
          hasAsked.current = true;
          askForNotices();
        }}
      >
        <ProjectBar
          projectName={snapshot.project.name}
          steps={railStepsOf({ ...facts, takes: facts.takes })}
          shownStep={shownStepOf(work.state)}
          exportLabel={exporting.label}
          onStep={(step) => {
            work.show({ choice: viewOfStep({ facts, step }) });
          }}
          onEditByHand={props.onEditByHand}
          onExport={exporting.open}
          onSettings={() => {
            settings.open(undefined);
          }}
        />
        <main className="work" data-view={work.state.kind}>
          <div className="work-head">
            <ChapterMenu work={work} />
          </div>
          <div className="work-body">
            <WorkBody
              client={client}
              snapshot={snapshot}
              work={work}
              running={running}
            />
          </div>
          {money === undefined ? (
            <NextActionBar
              action={work.action}
              isBusy={work.isBusy}
              failure={work.failure}
              onAction={work.act}
            />
          ) : (
            <MoneyFoot
              entry={money}
              onChoose={(choice) =>
                chat.chooseMoney({ entryId: money.id, choice })
              }
            />
          )}
        </main>
        <aside className="project-chat" aria-label="Chat with the lead">
          <ChatEdge />
          <ChatPanel
            chat={chat}
            box={box}
            files={files}
            chip={undefined}
            isHidden={false}
            sceneNumberOf={() => undefined}
            onOpenAiSettings={() => {
              settings.open(undefined);
            }}
            runningWork={[]}
            isMoneyElsewhere={money !== undefined}
            afterHistory={
              <ReadyLines
                takes={facts.takes}
                chapters={facts.chapters}
                onOpen={(takeId) => {
                  const take = facts.takes.find((each) => each.id === takeId);
                  work.show({
                    choice: { kind: "take", takeId },
                    ...(take?.chapterId === undefined
                      ? {}
                      : { chapterId: take.chapterId }),
                  });
                }}
              />
            }
          />
        </aside>
      </div>
      {sheet}
    </div>
  );
}
