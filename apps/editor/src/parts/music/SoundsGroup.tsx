import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { changeProject } from "../../scenes/directChange.js";
import { MadeWith, type ModelTarget } from "../../settings/services/index.js";
import { sendFixedRequest, type AskTheAi } from "../fixedRequests.js";
import { PlayButton } from "../sound/PlayButton.js";
import { soundEntriesOf, type SoundEntry } from "./soundsFacts.js";

async function removeEverywhere(options: {
  client: EngineClient;
  entry: SoundEntry;
}): Promise<string | undefined> {
  for (const place of options.entry.places) {
    const removed = await changeProject({
      client: options.client,
      name: "remove_clip",
      input: { output_id: place.outputId, clip_id: place.clipId },
    });
    if (removed.kind === "failed") return removed.message;
  }
  return undefined;
}

export function SoundsGroup(props: {
  client: EngineClient;
  snapshot: Snapshot;
  locked: boolean;
  ask: AskTheAi;
}) {
  const { client, locked } = props;
  const entries = soundEntriesOf(props.snapshot);
  const [words, setWords] = useState("");
  const [onceModel, setOnceModel] = useState<ModelTarget>();
  const [removing, setRemoving] = useState<string>();
  const [failure, setFailure] = useState<string>();

  return (
    <section className="part-group" aria-labelledby="sounds-title">
      <h4 id="sounds-title">Sounds</h4>
      {entries.length === 0 ? (
        <p className="fact lead">
          The video has no sounds yet. A sound plays at one moment, for example
          a door, a click, or rain.
        </p>
      ) : (
        <ul className="sound-list" aria-label="Sounds of the video">
          {entries.map((entry) => (
            <li key={entry.key} className="sound-item">
              <PlayButton
                client={client}
                piece={entry.piece}
                label={`the sound ${entry.name}`}
              />
              <span className="sound-words">
                <span className="track-name">{entry.name}</span>
                <span className="fact">{entry.where}</span>
              </span>
              <button
                type="button"
                className="link"
                disabled={locked || removing !== undefined}
                onClick={() => {
                  setRemoving(entry.key);
                  setFailure(undefined);
                  removeEverywhere({ client, entry })
                    .then(setFailure)
                    .catch((error: unknown) => {
                      setFailure(String(error));
                    })
                    .finally(() => {
                      setRemoving(undefined);
                    });
                }}
              >
                {removing === entry.key ? "Removing" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {failure === undefined ? undefined : (
        <p className="fact" role="alert">
          {failure}
        </p>
      )}
      <form
        className="describe"
        onSubmit={(event) => {
          event.preventDefault();
          sendFixedRequest({
            ask: props.ask,
            request: {
              kind: "add-a-sound",
              words: words.trim(),
              ...(onceModel === undefined ? {} : { model: onceModel }),
            },
          })
            .then((isSent) => {
              if (isSent) setWords("");
            })
            .catch(() => undefined);
        }}
      >
        <label>
          Add a sound
          <input
            type="text"
            value={words}
            placeholder="For example: a soft whoosh when the logo appears"
            required
            disabled={locked}
            onChange={(event) => {
              setWords(event.currentTarget.value);
            }}
          />
        </label>
        <button type="submit" disabled={locked || words.trim() === ""}>
          Add this sound
        </button>
      </form>
      <MadeWith
        client={client}
        kind="sound-effect"
        once={{ chosen: onceModel, onChoose: setOnceModel }}
      />
    </section>
  );
}
