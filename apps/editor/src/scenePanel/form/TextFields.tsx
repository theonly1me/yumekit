import { useId } from "react";
import { controlStateOf, FieldFrame } from "./FieldFrame.js";
import type { FieldProps } from "./formBinding.js";
import type { JsonValue } from "./propPath.js";

export function textOf(value: JsonValue | undefined): string {
  if (typeof value === "string") return value;
  return typeof value === "number" ? String(value) : "";
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
