import { useId, useState } from "react";
import { controlStateOf, FieldFrame } from "./FieldFrame.js";
import type { FieldProps } from "./formBinding.js";
import type { JsonValue } from "./propPath.js";
import { textOf } from "./TextFields.js";

const wholeNumberText = /^-?\d*$/;
const decimalNumberText = /^-?\d*\.?\d*$/;

type TypedNumber =
  { kind: "value"; value: JsonValue | undefined } | { kind: "unfinished" };

export function typedNumberOf(options: {
  text: string;
  isRequired: boolean;
}): TypedNumber {
  const { text, isRequired } = options;
  if (text === "") {
    return { kind: "value", value: isRequired ? "" : undefined };
  }
  const number = Number(text);
  return Number.isFinite(number) && /\d/.test(text)
    ? { kind: "value", value: number }
    : { kind: "unfinished" };
}

export function isNumberText(options: {
  text: string;
  isInteger: boolean;
}): boolean {
  return (options.isInteger ? wholeNumberText : decimalNumberText).test(
    options.text,
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
    const typed = typedNumberOf({ text, isRequired: field.isRequired });
    if (typed.kind === "unfinished" || textOf(typed.value) !== valueText) {
      setText(valueText);
    }
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
        inputMode={field.isInteger ? "numeric" : "decimal"}
        value={text}
        onBlur={form.flush}
        onChange={(event) => {
          const next = event.target.value.trim();
          if (!isNumberText({ text: next, isInteger: field.isInteger })) return;
          setText(next);
          const typed = typedNumberOf({
            text: next,
            isRequired: field.isRequired,
          });
          if (typed.kind === "unfinished") return;
          form.change({ path, value: typed.value, timing: "after-pause" });
        }}
        {...controlStateOf({ path, issue })}
      />
    </FieldFrame>
  );
}
