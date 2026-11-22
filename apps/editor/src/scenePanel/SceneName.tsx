import { useId, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Scene } from "../engine/snapshot.js";
import { callInOrder } from "./sceneCalls.js";

function renameInput(options: {
  scene: Scene;
  title: string;
  code: string | undefined;
}): object {
  const { scene, title, code } = options;
  const common = {
    scene_id: scene.id,
    title,
    notes: scene.notes,
    props: scene.source.props,
  };
  return scene.source.kind === "kit"
    ? { ...common, kit_component: scene.source.component }
    : { ...common, code: code ?? "" };
}

export function SceneName(props: {
  client: EngineClient;
  scene: Scene;
  code: string | undefined;
}) {
  const { client, scene } = props;
  const fieldId = useId();
  const [title, setTitle] = useState(scene.title);
  const [failure, setFailure] = useState<string>();

  const save = () => {
    const wanted = title.trim();
    if (wanted === "" || wanted === scene.title) {
      setTitle(scene.title);
      return;
    }
    setFailure(undefined);
    callInOrder({
      client,
      name: "put_scene",
      input: renameInput({ scene, title: wanted, code: props.code }),
    })
      .then((outcome) => {
        if (outcome.kind === "rejected") setFailure(outcome.message);
      })
      .catch((error: unknown) => {
        setFailure(String(error));
      });
  };

  return (
    <div className="field">
      <label htmlFor={fieldId}>Name of the scene</label>
      <input
        id={fieldId}
        type="text"
        className="scene-name"
        value={title}
        onChange={(event) => {
          setTitle(event.currentTarget.value);
        }}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      {failure === undefined ? undefined : (
        <p className="field-issue" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}
