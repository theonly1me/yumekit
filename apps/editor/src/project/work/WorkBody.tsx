import type { WorkItem } from "../../chat/running/workSchema.js";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { FilmView } from "../film/FilmView.js";
import { StoryReading } from "../story/StoryReading.js";
import { TakeView } from "../takes/TakeView.js";
import { progressOf } from "./progress.js";
import { chapterLineOf } from "./projectFacts.js";
import type { ProjectWork } from "./useProjectWork.js";
import { EmptyView, FailedView, WaitView } from "./WaitView.js";

export function WorkBody(props: {
  client: EngineClient;
  snapshot: Snapshot;
  work: ProjectWork;
  running: WorkItem[];
}) {
  const { client, snapshot, work } = props;
  const { state, facts } = work;
  switch (state.kind) {
    case "failed":
      return <FailedView failureKind={state.failureKind} />;
    case "waiting":
      return <WaitView phase={state.phase} requestText={facts.requestText} />;
    case "empty":
      return <EmptyView />;
    case "story":
      return (
        <StoryReading
          snapshot={snapshot}
          notes={work.notes}
          round={state.take?.number ?? 1}
        />
      );
    case "film":
      return (
        <FilmView
          client={client}
          snapshot={snapshot}
          take={state.take}
          chapterLine={chapterLineOf(facts)}
          notes={work.notes}
        />
      );
    case "making":
    case "take":
      return (
        <TakeView
          key={state.take.id}
          client={client}
          snapshot={snapshot}
          take={state.take}
          chapters={facts.chapters}
          notes={work.notes}
          progress={
            state.kind === "making"
              ? progressOf({ take: state.take, work: props.running })
              : undefined
          }
          onPickTake={(takeId) => {
            work.show({ choice: { kind: "take", takeId } });
          }}
        />
      );
  }
}

export function ChapterMenu(props: { work: ProjectWork }) {
  const { facts } = props.work;
  if (facts.chapters.length < 2) return undefined;
  return (
    <label className="chapter-menu">
      <span className="hidden-label">Chapter</span>
      <select
        value={facts.chapterId}
        onChange={(event) => {
          props.work.show({
            choice: { kind: "auto" },
            chapterId: event.target.value,
          });
        }}
      >
        {facts.chapters.map((...[chapter, index]) => (
          <option key={chapter.id} value={chapter.id}>
            Chapter {index + 1} of {facts.chapters.length}, {chapter.title}
          </option>
        ))}
      </select>
    </label>
  );
}
