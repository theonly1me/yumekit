import { useId, useState } from "react";
import { controlStateOf, FieldFrame } from "./FieldFrame.js";
import type { FieldProps } from "./formBinding.js";
import type { JsonValue } from "./propPath.js";

function textOf(value: JsonValue | undefined): string {
  if (typeof value === "string") return value;
  return typeof value === "number" ? String(value) : "";
}

function numberOrText(options: {
  text: string;
  isRequired: boolean;
}): JsonValue | undefined {
  const trimmed = options.text.trim();
  if (trimmed === "") return options.isRequired ? "" : undefined;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : options.text;
}

export function TextField(props: FieldProps<"text">) {
  const { field, path, form } = props;
  const controlId = useId();
  const issue = form.issueAt(path);
  const control = {
    id: controlId,
    value: textOf(form.valueAt(path)),
    onBlur: form.flush,
    ...controlStateOf({ path, issue }),
  };
  const onText = (text: string) => {
    form.change({
      path,
      value: text === "" && !field.isRequired ? undefined : text,
      timing: "after-pause",
    });
  };
  return (
    <FieldFrame
      controlId={controlId}
      path={path}
      label={field.label}
      issue={issue}
      isIssueBelowRow={form.isIssueBelowRow}
    >
      {field.isLong ? (
        <textarea
          {...control}
          rows={3}
          onChange={(event) => {
            onText(event.target.value);
          }}
        />
      ) : (
        <input
          {...control}
          type="text"
          onChange={(event) => {
            onText(event.target.value);
          }}
        />
      )}
    </FieldFrame>
  );
}

export function NumberField(props: FieldProps<"number">) {
  const { field, path, form } = props;
  const controlId = useId();
  const issue = form.issueAt(path);
  const valueText = textOf(form.valueAt(path));
  const [text, setText] = useState(valueText);
  const [shownValueText, setShownValueText] = useState(valueText);
  if (shownValueText !== valueText) {
    setShownValueText(valueText);
    const typed = numberOrText({ text, isRequired: field.isRequired });
    if (textOf(typed) !== valueText) setText(valueText);
  }
  return (
    <FieldFrame
      controlId={controlId}
      path={path}
      label={field.label}
      issue={issue}
      isIssueBelowRow={form.isIssueBelowRow}
    >
      <input
        id={controlId}
        type="text"
        inputMode="decimal"
        value={text}
        onBlur={form.flush}
        onChange={(event) => {
          setText(event.target.value);
          form.change({
            path,
            value: numberOrText({
              text: event.target.value,
              isRequired: field.isRequired,
            }),
            timing: "after-pause",
          });
        }}
        {...controlStateOf({ path, issue })}
      />
    </FieldFrame>
  );
}
