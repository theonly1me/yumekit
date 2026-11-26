import { useId, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { changeProject } from "../scenes/directChange.js";

export function ApprovePicturesRow(props: {
  client: EngineClient;
  isOn: boolean;
}) {
  const switchId = useId();
  const [picked, setPicked] = useState<boolean>();
  const [failure, setFailure] = useState<string>();
  const change = (isOn: boolean) => {
    setPicked(isOn);
    setFailure(undefined);
    changeProject({
      client: props.client,
      name: "set_approve_pictures_first",
      input: { approve_pictures_first: isOn },
    })
      .then((outcome) => {
        if (outcome.kind === "failed") {
          setFailure(`The choice did not change. ${outcome.message}`);
        }
      })
      .catch(() => {
        setFailure("The choice did not change. Try again.");
      })
      .finally(() => {
        setPicked(undefined);
      });
  };
  return (
    <div className="setting-row">
      <label className="setting-name" htmlFor={switchId}>
        Approve pictures before clips
        <em>
          Clips cost the most. The lead makes them only from pictures that you
          approved. Turn it off for a quick draft.
        </em>
      </label>
      <input
        id={switchId}
        type="checkbox"
        role="switch"
        checked={picked ?? props.isOn}
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
