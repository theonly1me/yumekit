import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { Sheet } from "../sheets/Sheet.js";
import {
  castKindLabels,
  maximumPictures,
  type CastEntry,
} from "./castEntries.js";
import { removeCastEntry } from "./castCalls.js";
import { CastForm } from "./CastForm.js";
import { CastPicture } from "./CastPictures.js";
import "./cast.css";

type Editing =
  { kind: "none" } | { kind: "new" } | { kind: "entry"; id: string };

export const emptyCastText =
  "Add the people, places, and products of your video. yumekit keeps them the same in each scene.";

const filledCastText =
  "yumekit keeps each entry the same in each scene. The AI uses the pictures as a guide.";

function CastRow(props: {
  client: EngineClient;
  entry: CastEntry;
  isBusy: boolean;
  onChange: () => void;
  onRemove: () => void;
  onMakePicture: () => void;
}) {
  const { entry } = props;
  return (
    <li className="cast-row">
      <div
        className="cast-row-pictures"
        aria-hidden={entry.referenceAssetIds.length === 0}
      >
        {[...entry.referenceAssetIds.entries()].map(([index, assetId]) => (
          <CastPicture
            key={assetId}
            client={props.client}
            assetId={assetId}
            label={`Picture ${String(index + 1)} of ${entry.name}`}
          />
        ))}
      </div>
      <div className="cast-row-text">
        <h3>{entry.name}</h3>
        <p className="cast-kind">{castKindLabels[entry.kind]}</p>
        {entry.description === "" ? undefined : (
          <p className="cast-description">{entry.description}</p>
        )}
      </div>
      <div className="cast-row-actions">
        <button type="button" disabled={props.isBusy} onClick={props.onChange}>
          Change
        </button>
        {entry.referenceAssetIds.length < maximumPictures ? (
          <button type="button" onClick={props.onMakePicture}>
            Make a picture of this
          </button>
        ) : undefined}
        <button type="button" disabled={props.isBusy} onClick={props.onRemove}>
          Remove
        </button>
      </div>
    </li>
  );
}

export function CastSheet(props: {
  client: EngineClient;
  entries: CastEntry[];
  onMakePicture: (entry: CastEntry) => void;
  onClose: () => void;
}) {
  const { client, entries } = props;
  const [editing, setEditing] = useState<Editing>({ kind: "none" });
  const [removingId, setRemovingId] = useState<string>();
  const [failure, setFailure] = useState<string>();
  const stopEditing = () => {
    setEditing({ kind: "none" });
  };

  const remove = (entry: CastEntry) => {
    setRemovingId(entry.id);
    setFailure(undefined);
    removeCastEntry({ client, castId: entry.id })
      .then((removed) => {
        if (!removed.ok) setFailure(removed.message);
      })
      .catch((error: unknown) => {
        setFailure(String(error));
      })
      .finally(() => {
        setRemovingId(undefined);
      });
  };

  return (
    <Sheet titleId="cast-title" onClose={props.onClose}>
      <div className="sheet-body cast">
        <h2 id="cast-title">Cast</h2>
        <p className="fact lead">
          {entries.length === 0 ? emptyCastText : filledCastText}
        </p>
        {entries.length === 0 ? undefined : (
          <ul className="cast-rows">
            {entries.map((entry) =>
              editing.kind === "entry" && editing.id === entry.id ? (
                <li key={entry.id} className="cast-row editing">
                  <CastForm
                    client={client}
                    entries={entries}
                    entry={entry}
                    onDone={stopEditing}
                  />
                </li>
              ) : (
                <CastRow
                  key={entry.id}
                  client={client}
                  entry={entry}
                  isBusy={removingId === entry.id}
                  onChange={() => {
                    setEditing({ kind: "entry", id: entry.id });
                  }}
                  onRemove={() => {
                    remove(entry);
                  }}
                  onMakePicture={() => {
                    props.onMakePicture(entry);
                  }}
                />
              ),
            )}
          </ul>
        )}
        {failure === undefined ? undefined : (
          <p className="failure" role="alert">
            {failure}
          </p>
        )}
        {editing.kind === "new" ? (
          <CastForm
            client={client}
            entries={entries}
            entry={undefined}
            onDone={stopEditing}
          />
        ) : (
          <div className="start-action">
            <button
              type="button"
              className="primary"
              onClick={() => {
                setEditing({ kind: "new" });
              }}
            >
              Add to the cast
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
