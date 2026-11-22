import { useMemo } from "react";
import { z } from "zod";
import {
  createEngineClient,
  type EngineClient,
} from "./engine/engineClient.js";
import type { Snapshot } from "./engine/snapshot.js";
import { useProject } from "./engine/useProject.js";
import { StartScreen } from "./home/StartScreen.js";
import { useServerKind } from "./home/useServerKind.js";
import { MakingFailure, MakingScreen } from "./making/MakingScreen.js";
import { useMakingGate } from "./making/useMakingGate.js";
import { Editor } from "./shell/Editor.js";
import { StateScreen } from "./shell/StateScreen.js";

const stopSchema = z.object({ stopped: z.boolean() });

function ProjectScreens(props: {
  client: EngineClient;
  snapshot: Snapshot;
  projectFolder: string;
  firstRequestFailure: string | undefined;
}) {
  const { client, snapshot } = props;
  const gate = useMakingGate({
    client,
    firstRequestFailure: props.firstRequestFailure,
  });
  switch (gate.kind) {
    case "loading":
      return <StateScreen state={{ kind: "loading" }} />;
    case "failure":
      return (
        <MakingFailure
          failure={gate.failure}
          onOpenEditor={gate.onOpenEditor}
        />
      );
    case "making":
      return (
        <MakingScreen
          client={client}
          snapshot={snapshot}
          chat={gate.chat}
          onStop={() => {
            client
              .readJson({
                path: "/api/chat/stop",
                schema: stopSchema,
                body: {},
              })
              .catch(() => undefined);
          }}
          onOpenEditor={gate.onOpenEditor}
        />
      );
    case "editor":
      return (
        <Editor
          client={client}
          snapshot={snapshot}
          projectFolder={props.projectFolder}
        />
      );
  }
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
