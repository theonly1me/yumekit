import { lazy, Suspense, useState } from "react";
import type { StepViewProps } from "../frame/stepViewProps.js";
import { StatusLine } from "../sound/StatusLine.js";
import { useMediaServers } from "../../tools/useMediaServers.js";
import { fileGroupsOf } from "./fileFacts.js";
import { FileDrop } from "./FileDrop.js";
import { FileRowView, type FileRowActions } from "./FileRowView.js";
import { useFileActions } from "./useFileActions.js";
import "./filesView.css";

const projectFileTypes =
  "image/*,audio/*,video/*,.svg,.mp3,.wav,.m4a,.mp4,.mov,.woff2,.woff,.ttf,.otf";

const RequestsView = lazy(() =>
  import("./requests/RequestsView.js").then((module) => ({
    default: module.RequestsView,
  })),
);

type FilesTab = "files" | "requests";

function FilesTabs(props: {
  tab: FilesTab;
  fileCount: number;
  onTab: (tab: FilesTab) => void;
}) {
  const tabs: { id: FilesTab; label: string }[] = [
    { id: "files", label: "Files" },
    { id: "requests", label: "Requests" },
  ];
  return (
    <div className="files-tabs" role="tablist" aria-label="Files and requests">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className="tab"
          aria-selected={props.tab === tab.id}
          onClick={() => {
            props.onTab(tab.id);
          }}
        >
          {tab.label}
          {tab.id === "files" ? <span>{props.fileCount}</span> : undefined}
        </button>
      ))}
    </div>
  );
}

export function FilesView(props: StepViewProps) {
  const { client, snapshot, locked } = props;
  const [tab, setTab] = useState<FilesTab>("files");
  const media = useMediaServers(client);
  const groups = fileGroupsOf({
    snapshot,
    servers: media.state.kind === "ready" ? media.state.servers : undefined,
  });
  const files = useFileActions({ client, ask: props.ask });
  const rowActions: FileRowActions = {
    isOff: locked || files.isWorking,
    isWorking: files.isWorking,
    onDownload: (row) => {
      files.download({ assetId: row.asset.id, name: row.name });
    },
    onRemove: (row) => {
      files.remove({ assetId: row.asset.id, name: row.name });
    },
    onUse: (row) => {
      files.useInVideo(row.name);
    },
    onUseFont: (row) => {
      files.useFont({ snapshot, assetId: row.asset.id, name: row.name });
    },
  };

  const fileCount = groups.reduce(
    (...[count, group]) => count + group.rows.length,
    0,
  );
  const tabs = <FilesTabs tab={tab} fileCount={fileCount} onTab={setTab} />;
  if (tab === "requests") {
    return (
      <div className="files-part">
        {tabs}
        <Suspense
          fallback={
            <p className="fact lead" role="status">
              Loading the requests.
            </p>
          }
        >
          <RequestsView
            client={client}
            assets={snapshot.assets}
            servers={
              media.state.kind === "ready" ? media.state.servers : undefined
            }
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="files-part">
      {tabs}
      {groups.length === 0 ? (
        <p className="fact lead">
          This video has no files yet. Add a picture, a sound, a video clip, or
          a font below, or ask the AI in the chat to make one.
        </p>
      ) : (
        <p className="fact">
          Each picture, sound, and video clip of this video. Remove is off for a
          file that the video uses.
        </p>
      )}
      {groups.map((group) => (
        <section
          key={group.id}
          className="part-group"
          aria-labelledby={`files-${group.id}`}
        >
          <h4 id={`files-${group.id}`}>
            {group.title} <span className="fact">{group.rows.length}</span>
          </h4>
          <ul className="file-rows" aria-label={group.title}>
            {group.rows.map((row) => (
              <FileRowView
                key={row.asset.id}
                client={client}
                row={row}
                actions={rowActions}
              />
            ))}
          </ul>
        </section>
      ))}
      <section className="part-group">
        <h4>Add a file</h4>
        <FileDrop
          label="Drop a file here, or click to pick one"
          hint="A picture, a sound, a video clip, or a font, up to 500 megabytes. The AI can then use it in the video."
          accept={projectFileTypes}
          disabled={locked || files.isWorking}
          onFile={files.add}
        />
      </section>
      <StatusLine status={files.status} />
    </div>
  );
}
