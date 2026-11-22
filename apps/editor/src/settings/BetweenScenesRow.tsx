import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import { changeProject } from "../scenes/directChange.js";
import { mainSceneClipsOf } from "../timeline/timelineFacts.js";
import { sharedChoiceOf } from "../transitions/transitionChoices.js";
import { TransitionPicker } from "../transitions/TransitionPicker.js";

function betweenScenesOf(snapshot: Snapshot) {
  const shared = new Set(
    snapshot.timelines.map((timeline) =>
      sharedChoiceOf(mainSceneClipsOf({ timeline, scenes: snapshot.scenes })),
    ),
  );
  shared.delete("none");
  const [only] = shared;
  return only === undefined ? "none" : shared.size === 1 ? only : "mixed";
}

export function BetweenScenesRow(props: {
  client: EngineClient;
  snapshot: Snapshot;
}) {
  const [failure, setFailure] = useState<string>();
  const [isChanging, setChanging] = useState(false);
  const current = betweenScenesOf(props.snapshot);
  return (
    <div className="setting-row">
      <span>
        Between scenes
        <em>
          {current === "none"
            ? "Add a second scene first. Then pick how each scene changes to the next."
            : current === "mixed"
              ? "The scenes change in different ways now. A pick sets one way for the whole video."
              : "How each scene changes to the next, in each shape of the video."}
        </em>
      </span>
      <TransitionPicker
        label="Between scenes"
        current={
          current === "none" || current === "mixed" ? undefined : current
        }
        disabled={current === "none" || isChanging}
        onPick={(kind) => {
          setChanging(true);
          setFailure(undefined);
          changeProject({
            client: props.client,
            name: "set_transitions",
            input: { kind },
          })
            .then((outcome) => {
              if (outcome.kind === "failed") setFailure(outcome.message);
            })
            .catch((error: unknown) => {
              setFailure(`The change did not apply. ${String(error)}`);
            })
            .finally(() => {
              setChanging(false);
            });
        }}
      />
      {failure === undefined ? undefined : (
        <p className="change-failure" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}
