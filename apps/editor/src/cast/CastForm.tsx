import { useId, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import {
  castKindLabels,
  castKinds,
  newCastIdOf,
  type CastEntry,
  type CastKind,
} from "./castEntries.js";
import { saveCastEntry, uploadPicture } from "./castCalls.js";
import { CastPictureList } from "./CastPictures.js";

type FormState =
  | { kind: "editing" }
  | { kind: "saving" }
  | { kind: "uploading" }
  | { kind: "failed"; message: string };

export function CastForm(props: {
  client: EngineClient;
  entries: CastEntry[];
  entry: CastEntry | undefined;
  onDone: () => void;
}) {
  const { entry } = props;
  const fieldId = useId();
  const [kind, setKind] = useState<CastKind>(entry?.kind ?? "person");
  const [name, setName] = useState(entry?.name ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [pictureIds, setPictureIds] = useState(entry?.referenceAssetIds ?? []);
  const [state, setState] = useState<FormState>({ kind: "editing" });
  const isBusy = state.kind === "saving" || state.kind === "uploading";

  const save = () => {
    setState({ kind: "saving" });
    const id =
      entry?.id ?? newCastIdOf({ name: name.trim(), entries: props.entries });
    saveCastEntry({
      client: props.client,
      entry: {
        id,
        kind,
        name: name.trim(),
        description,
        referenceAssetIds: pictureIds,
      },
    })
      .then((saved) => {
        if (saved.ok) props.onDone();
        else setState({ kind: "failed", message: saved.message });
      })
      .catch((error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      });
  };

  const upload = (file: File) => {
    setState({ kind: "uploading" });
    uploadPicture({ client: props.client, file })
      .then((uploaded) => {
        if (!uploaded.ok) {
          setState({ kind: "failed", message: uploaded.message });
          return;
        }
        setPictureIds((current) => [...current, uploaded.assetId]);
        setState({ kind: "editing" });
      })
      .catch((error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      });
  };

  return (
    <form
      className="cast-form"
      aria-label={
        entry === undefined ? "New cast entry" : `Change ${entry.name}`
      }
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="segments" role="group" aria-label="What it is">
        {castKinds.map((candidate) => (
          <button
            key={candidate}
            type="button"
            aria-pressed={candidate === kind}
            onClick={() => {
              setKind(candidate);
            }}
          >
            {castKindLabels[candidate]}
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor={`${fieldId}-name`}>Name</label>
        <input
          id={`${fieldId}-name`}
          type="text"
          value={name}
          placeholder="Mia, the kitchen, the blue mug"
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label htmlFor={`${fieldId}-description`}>What it looks like</label>
        <textarea
          id={`${fieldId}-description`}
          rows={2}
          value={description}
          placeholder="A woman in her thirties with short black hair and a green coat"
          onChange={(event) => {
            setDescription(event.target.value);
          }}
        />
      </div>
      <CastPictureList
        client={props.client}
        name={name.trim() === "" ? "this entry" : name.trim()}
        pictureIds={pictureIds}
        isUploading={state.kind === "uploading"}
        onRemove={(assetId) => {
          setPictureIds((current) => current.filter((id) => id !== assetId));
        }}
        onUpload={upload}
      />
      {state.kind === "failed" ? (
        <p className="failure" role="alert">
          {state.message}
        </p>
      ) : undefined}
      <div className="cast-form-actions">
        <button
          type="submit"
          className="primary"
          disabled={name.trim() === "" || isBusy}
        >
          {state.kind === "saving" ? "Saving" : "Save"}
        </button>
        <button type="button" onClick={props.onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
