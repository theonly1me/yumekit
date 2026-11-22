import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { MadeWith, type ModelTarget } from "../../settings/services/index.js";

export function ChangePictureForm(props: {
  client: EngineClient;
  locked: boolean;
  onAsk: (change: { words: string; model?: ModelTarget }) => Promise<boolean>;
}) {
  const [words, setWords] = useState("");
  const [onceModel, setOnceModel] = useState<ModelTarget>();
  return (
    <div className="change-picture">
      <form
        className="describe"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = words.trim();
          if (trimmed === "") return;
          props
            .onAsk({
              words: trimmed,
              ...(onceModel === undefined ? {} : { model: onceModel }),
            })
            .then((isSent) => {
              if (isSent) setWords("");
            })
            .catch(() => undefined);
        }}
      >
        <label>
          Describe a change to this picture
          <input
            type="text"
            value={words}
            placeholder="For example: a night sky, with the text at the bottom"
            required
            disabled={props.locked}
            onChange={(event) => {
              setWords(event.target.value);
            }}
          />
        </label>
        <button type="submit" disabled={props.locked}>
          Change the picture
        </button>
      </form>
      <MadeWith
        client={props.client}
        kind="image"
        once={{ chosen: onceModel, onChoose: setOnceModel }}
      />
    </div>
  );
}
