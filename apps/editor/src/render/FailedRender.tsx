import type { FailedAt } from "./renderJobs.js";

export function FailedRender(props: {
  message: string;
  failedAt: FailedAt | undefined;
  sceneTitle: string | undefined;
  onOpenScene: (failedAt: FailedAt) => void;
}) {
  const { failedAt } = props;
  return (
    <div className="render-failure">
      <p role="alert">{props.message}</p>
      {failedAt === undefined ? undefined : (
        <>
          <p className="fact">
            Ask your agent to correct the scene{" "}
            {props.sceneTitle ?? failedAt.sceneId}, or change it in the Scene
            panel.
          </p>
          <div className="render-actions">
            <button
              type="button"
              onClick={() => {
                props.onOpenScene(failedAt);
              }}
            >
              Open this scene
            </button>
          </div>
        </>
      )}
    </div>
  );
}
