import type { EngineClient } from "../../engine/engineClient.js";
import type { Scene, Snapshot } from "../../engine/snapshot.js";
import { KitForm } from "../../scenePanel/form/KitForm.js";
import { useKitScenes } from "../../scenePanel/useKitScenes.js";
import "../../scenePanel/scenePanel.css";

function KitFields(props: {
  client: EngineClient;
  snapshot: Snapshot;
  scene: Scene;
  component: string;
}) {
  const { client, scene, component, snapshot } = props;
  const kitScenes = useKitScenes(client);
  if (kitScenes.kind === "loading") return undefined;
  if (kitScenes.kind === "failed") {
    return <p className="field-issue">{kitScenes.message}</p>;
  }
  const kitScene = kitScenes.kitScenes.find(
    (candidate) => candidate.name === component,
  );
  if (kitScene === undefined) return undefined;
  return (
    <KitForm
      key={scene.id}
      client={client}
      scene={scene}
      component={component}
      schema={kitScene.props}
      assets={snapshot.assets}
      revision={snapshot.revision}
    />
  );
}

export function SceneFields(props: {
  client: EngineClient;
  snapshot: Snapshot;
  scene: Scene;
  locked: boolean;
}) {
  const { scene } = props;
  if (scene.source.kind !== "kit") {
    return (
      <p className="fact">
        The AI draws this scene with its own code. Describe a change below.
      </p>
    );
  }
  return (
    <fieldset
      className="scene-fields"
      disabled={props.locked}
      aria-label="Text in the picture"
    >
      <KitFields
        client={props.client}
        snapshot={props.snapshot}
        scene={scene}
        component={scene.source.component}
      />
    </fieldset>
  );
}
