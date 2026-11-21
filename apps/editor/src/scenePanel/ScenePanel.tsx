import type { EngineClient } from "../engine/engineClient.js";
import type { Scene, SceneClip, Snapshot } from "../engine/snapshot.js";
import { secondsText } from "../timeline/clock.js";
import { KitForm } from "./form/KitForm.js";
import { HistoryGroup } from "./history/HistoryGroup.js";
import type { History } from "./history/useHistory.js";
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
  clip: SceneClip | undefined;
  scene: Scene | undefined;
  history: History;
}) {
  const { client, snapshot, clip, scene } = props;
  const framesPerSecond = snapshot.project.framesPerSecond;
  if (clip === undefined || scene === undefined) {
    return (
      <>
        <h2>Scene</h2>
        <p className="fact">
          Pick a scene in the scenes row or a scene clip in the timeline.
        </p>
        <HistoryGroup history={props.history} />
      </>
    );
  }
  return (
    <>
      <h2>{scene.title}</h2>
      <p className="fact">
        {scene.source.kind === "kit" ? (
          <>
            Kit scene <strong>{scene.source.component}</strong>.
          </>
        ) : (
          "Custom scene with its own code."
        )}{" "}
        Starts at frame <strong>{clip.startFrame}</strong>, runs{" "}
        <strong>{clip.durationFrames}</strong> frames (
        {secondsText({ frames: clip.durationFrames, framesPerSecond })}).
      </p>
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
      <HistoryGroup history={props.history} />
    </>
  );
}
