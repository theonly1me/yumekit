import { lazy, Suspense, useMemo } from "react";
import {
  createEngineClient,
  type EngineClient,
} from "./engine/engineClient.js";
import type { Snapshot } from "./engine/snapshot.js";
import { useProject } from "./engine/useProject.js";
import { StartScreen } from "./home/StartScreen.js";
import { useServerKind } from "./home/useServerKind.js";
import { ProjectScreen } from "./project/ProjectScreen.js";
import { useReadySignal } from "./project/ready/useReadySignal.js";
import { chaptersOf } from "./project/takes/verdicts.js";
import { useScreen } from "./project/useScreen.js";
import { StateScreen } from "./shell/StateScreen.js";

const Editor = lazy(() =>
  import("./shell/Editor.js").then((module) => ({ default: module.Editor })),
);

function ProjectScreens(props: {
  client: EngineClient;
  snapshot: Snapshot;
  projectFolder: string;
  firstRequestFailure: string | undefined;
}) {
  const { client, snapshot } = props;
  const { screen, go } = useScreen();
  useReadySignal({
    takes: snapshot.takes ?? [],
    chapters: chaptersOf(snapshot.bible.storyPlan),
    projectName: snapshot.project.name,
  });
  if (screen === "editor") {
    return (
      <Suspense fallback={<StateScreen state={{ kind: "loading" }} />}>
        <Editor
          client={client}
          snapshot={snapshot}
          projectFolder={props.projectFolder}
          onBackToProject={() => {
            go("project");
          }}
        />
      </Suspense>
    );
  }
  return (
    <ProjectScreen
      client={client}
      snapshot={snapshot}
      projectFolder={props.projectFolder}
      startFailure={props.firstRequestFailure}
      onEditByHand={() => {
        go("editor");
      }}
    />
  );
}

function Connected(props: {
  client: EngineClient;
  firstRequestFailure: string | undefined;
}) {
  const state = useProject(props.client);
  if (state.kind === "loading") {
    return <StateScreen state={{ kind: "loading" }} />;
  }
  if (state.kind === "failed") {
    return <StateScreen state={state.failure} />;
  }
  return (
    <ProjectScreens
      client={props.client}
      snapshot={state.snapshot}
      projectFolder={state.projectFolder}
      firstRequestFailure={props.firstRequestFailure}
    />
  );
}

function Served(props: {
  client: EngineClient;
  firstRequestFailure: string | undefined;
}) {
  const serverKind = useServerKind(props.client);
  if (serverKind === "loading") {
    return <StateScreen state={{ kind: "loading" }} />;
  }
  if (serverKind === "home") return <StartScreen client={props.client} />;
  return (
    <Connected
      client={props.client}
      firstRequestFailure={props.firstRequestFailure}
    />
  );
}

export function App(props: {
  token: string | undefined;
  firstRequestFailure: string | undefined;
}) {
  const { token } = props;
  const client = useMemo(
    () => (token === undefined ? undefined : createEngineClient(token)),
    [token],
  );
  if (client === undefined) {
    return <StateScreen state={{ kind: "token-missing" }} />;
  }
  return (
    <Served client={client} firstRequestFailure={props.firstRequestFailure} />
  );
}
