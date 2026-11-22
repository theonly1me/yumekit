import type { LookId } from "@yumekit/scene-kit";
import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { LookChoices } from "../looks/LookChoices.js";
import { callInOrder } from "../scenePanel/sceneCalls.js";

export function LookRow(props: { client: EngineClient; look: string }) {
  const [picked, setPicked] = useState<string>();
  const [failure, setFailure] = useState<string>();
  const shown = picked ?? props.look;
  const choose = (look: LookId) => {
    setPicked(look);
    setFailure(undefined);
    callInOrder({ client: props.client, name: "set_look", input: { look } })
      .then((outcome) => {
        setPicked(undefined);
        if (outcome.kind === "rejected") {
          setFailure(`The look did not change. ${outcome.message}`);
        }
      })
      .catch(() => {
        setPicked(undefined);
        setFailure("The look did not change. Try again.");
      });
  };
  return (
    <div className="setting-row look-row">
      <span>
        Look
        <em>
          The colors and the fonts of each scene. The preview changes at once.
        </em>
      </span>
      <LookChoices chosen={shown} onChoose={choose} />
      {failure === undefined ? undefined : (
        <p className="fact change-failure" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}
