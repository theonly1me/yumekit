import { useState } from "react";
import "./files.css";

export function FileDrop(props: {
  label: string;
  hint: string;
  accept: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const [isOver, setOver] = useState(false);
  return (
    <label
      className="file-drop"
      data-off={props.disabled}
      data-over={isOver}
      onDragOver={(event) => {
        if (props.disabled) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => {
        setOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const [file] = event.dataTransfer.files;
        if (!props.disabled && file !== undefined) props.onFile(file);
      }}
    >
      <span>{props.label}</span>
      <span className="fact">{props.hint}</span>
      <input
        type="file"
        accept={props.accept}
        disabled={props.disabled}
        onChange={(event) => {
          const input = event.currentTarget;
          const [file] = input.files ?? [];
          input.value = "";
          if (file !== undefined) props.onFile(file);
        }}
      />
    </label>
  );
}

export function FileButton(props: {
  label: string;
  accept: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="file-button" data-off={props.disabled}>
      {props.label}
      <input
        type="file"
        accept={props.accept}
        disabled={props.disabled}
        onChange={(event) => {
          const input = event.currentTarget;
          const [file] = input.files ?? [];
          input.value = "";
          if (file !== undefined) props.onFile(file);
        }}
      />
    </label>
  );
}
