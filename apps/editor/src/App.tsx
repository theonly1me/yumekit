import { useMemo } from "react";
import {
  createEngineClient,
  type EngineClient,
} from "./engine/engineClient.js";
import { useProject } from "./engine/useProject.js";
import { Editor } from "./shell/Editor.js";
import { StateScreen } from "./shell/StateScreen.js";

function Connected(props: { client: EngineClient }) {
  const state = useProject(props.client);
  if (state.kind === "loading") {
    return <StateScreen state={{ kind: "loading" }} />;
  }
  if (state.kind === "failed") {
    return <StateScreen state={state.failure} />;
  }
  return (
    <Editor
      client={props.client}
      snapshot={state.snapshot}
      projectFolder={state.projectFolder}
    />
  );
}

export function App(props: { token: string | undefined }) {
  const { token } = props;
  const client = useMemo(
    () => (token === undefined ? undefined : createEngineClient(token)),
    [token],
  );
  if (client === undefined) {
    return <StateScreen state={{ kind: "token-missing" }} />;
  }
  return <Connected client={client} />;
}
