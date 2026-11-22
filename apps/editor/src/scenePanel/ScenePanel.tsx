import type { ReactNode } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Scene, SceneClip, Snapshot } from "../engine/snapshot.js";
import { LengthStepper } from "../scenes/LengthStepper.js";
import { KitForm } from "./form/KitForm.js";
import { HistoryGroup } from "./history/HistoryGroup.js";
import type { History } from "./history/useHistory.js";
import { SceneName } from "./SceneName.js";
import { useFirstTextFocus } from "./useFirstTextFocus.js";
import { useKitScenes } from "./useKitScenes.js";
import "./scenePanel.css";

function KitScene(props: {
  client: EngineClient;
  scene: Scene;
  component: string;
  snapshot: Snapshot;
}) {
  const { client, scene, component } = props;
  const kitScenes = useKitScenes(client);
  if (kitScenes.kind === "loading") return undefined;
  if (kitScenes.kind === "failed") {
    return <p className="field-issue">{kitScenes.message}</p>;
  }
  const kitScene = kitScenes.kitScenes.find(
    (candidate) => candidate.name === component,
  );
  if (kitScene === undefined) {
    return (
      <p className="fact">
        The kit has no scene {component}. Ask your agent to correct this scene.
      </p>
    );
  }
  return (
    <KitForm
      key={scene.id}
      client={client}
      scene={scene}
      component={component}
      schema={kitScene.props}
      assets={props.snapshot.assets}
      revision={props.snapshot.revision}
    />
  );
}

function CustomCode(props: { code: string | undefined }) {
  return (
    <div className="group">
      <h3>Code</h3>
      <p className="fact">
        Your agent writes and changes the code of a custom scene. Ask your agent
        for a change.
      </p>
      <pre className="config scene-code" tabIndex={0} aria-label="Scene code">
        {props.code ?? "The code of this scene is missing."}
      </pre>
    </div>
  );
}

export function ScenePanel(props: {
  client: EngineClient;
  snapshot: Snapshot;
  clip: SceneClip;
  scene: Scene;
  history: History;
  focusRequest: number;
  pictureGroup: ReactNode;
  onLength: (durationFrames: number) => void;
}) {
  const { client, snapshot, clip, scene } = props;
  const panel = useFirstTextFocus({
    request: props.focusRequest,
    hasForm: scene.source.kind === "kit",
  });
  return (
    <div className="scene-panel" ref={panel}>
      <SceneName
        key={`${scene.id}:${scene.title}`}
        client={client}
        scene={scene}
        code={snapshot.sceneCode[scene.id]}
      />
      <div className="field">
        <span className="field-label">Length</span>
        <LengthStepper
          durationFrames={clip.durationFrames}
          framesPerSecond={snapshot.project.framesPerSecond}
          onLength={props.onLength}
        />
      </div>
      {scene.source.kind === "kit" ? (
        <KitScene
          client={client}
          scene={scene}
          component={scene.source.component}
          snapshot={snapshot}
        />
      ) : (
        <CustomCode code={snapshot.sceneCode[scene.id]} />
      )}
      {props.pictureGroup}
      <HistoryGroup history={props.history} />
    </div>
  );
}
