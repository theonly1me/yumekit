import { useEffect, useRef, useState } from "react";

export function AddSceneForm(props: {
  afterNumber: number;
  onAdd: (description: string) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState("");
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    field.current?.focus();
  }, [props.afterNumber]);

  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (description.trim() === "") return;
        props.onAdd(description.trim());
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") props.onCancel();
      }}
    >
      <label htmlFor="new-scene">
        Describe the new scene after scene {props.afterNumber}
      </label>
      <input
        type="text"
        id="new-scene"
        ref={field}
        placeholder="A customer says why they like it"
        required
        value={description}
        onChange={(event) => {
          setDescription(event.currentTarget.value);
        }}
      />
      <button type="submit" className="primary">
        Add the scene
      </button>
      <button type="button" onClick={props.onCancel}>
        Cancel
      </button>
    </form>
  );
}
