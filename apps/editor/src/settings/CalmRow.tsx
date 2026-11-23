import { useId, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { changeProject } from "../scenes/directChange.js";

export function CalmRow(props: { client: EngineClient; calm: boolean }) {
  const switchId = useId();
  const [picked, setPicked] = useState<boolean>();
  const [failure, setFailure] = useState<string>();
  const shown = picked ?? props.calm;
  const change = (calm: boolean) => {
    setPicked(calm);
    setFailure(undefined);
    changeProject({ client: props.client, name: "set_look", input: { calm } })
      .then((outcome) => {
        if (outcome.kind === "failed") {
          setFailure(`The motion did not change. ${outcome.message}`);
        }
      })
      .catch(() => {
        setFailure("The motion did not change. Try again.");
      })
      .finally(() => {
        setPicked(undefined);
      });
  };
  return (
    <div className="setting-row">
      <label className="setting-name" htmlFor={switchId}>
        Calm motion
        <em>Scenes fade in with no move.</em>
      </label>
      <input
        id={switchId}
        type="checkbox"
        role="switch"
        checked={shown}
        onChange={(event) => {
          change(event.target.checked);
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
