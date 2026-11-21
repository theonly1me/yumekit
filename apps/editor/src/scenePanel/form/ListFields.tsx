import { useEffect, useId, useState, type ReactNode } from "react";
import { controlStateOf, IssueLine } from "./FieldFrame.js";
import { newItemOf, type FieldProps, type FormBinding } from "./formBinding.js";
import type { Field } from "./fields.js";
import type { JsonValue, PropPath } from "./propPath.js";

export type FieldRenderer = (options: {
  field: Field;
  path: PropPath;
}) => ReactNode;

function moved(options: { list: JsonValue[]; from: number; to: number }) {
  const list = [...options.list];
  const [item] = list.splice(options.from, 1);
  if (item !== undefined) list.splice(options.to, 0, item);
  return list;
}

function articleOf(noun: string): string {
  return /^[aeiou]/i.test(noun) ? "an" : "a";
}

function useListEdits(options: {
  field: Extract<Field, { kind: "text-list" | "object-list" }>;
  path: PropPath;
  form: FormBinding;
  listId: string;
}) {
  const { field, path, form, listId } = options;
  const value = form.valueAt(path);
  const list = Array.isArray(value) ? value : [];
  const [focusIndex, setFocusIndex] = useState<number>();

  useEffect(() => {
    if (focusIndex === undefined) return;
    const rows = document
      .getElementById(listId)
      ?.querySelectorAll(".list-item");
    rows?.[focusIndex]?.querySelector("input")?.focus();
  }, [focusIndex, listId]);

  const replace = (next: JsonValue[]) => {
    form.change({ path, value: next, timing: "now" });
  };
  const noun = field.itemLabel.toLowerCase();
  const canAdd = list.length < (field.maxItems ?? Infinity);
  return {
    list,
    noun,
    addButton: (
      <button
        type="button"
        className="quiet"
        disabled={!canAdd}
        onClick={() => {
          const item =
            field.kind === "text-list" ? "" : newItemOf(field.fields);
          form.change({
            path,
            value: [...list, item],
            timing: "on-next-change",
          });
          setFocusIndex(list.length);
        }}
      >
        Add {articleOf(noun)} {noun}
      </button>
    ),
    actionsOf: (index: number) => (
      <div className="item-actions">
        <button
          type="button"
          className="quiet"
          aria-label={`Move ${noun} ${String(index + 1)} up`}
          disabled={index === 0}
          onClick={() => {
            replace(moved({ list, from: index, to: index - 1 }));
          }}
        >
          ↑
        </button>
        <button
          type="button"
          className="quiet"
          aria-label={`Move ${noun} ${String(index + 1)} down`}
          disabled={index === list.length - 1}
          onClick={() => {
            replace(moved({ list, from: index, to: index + 1 }));
          }}
        >
          ↓
        </button>
        <button
          type="button"
          className="quiet"
          aria-label={`Remove ${noun} ${String(index + 1)}`}
          onClick={() => {
            replace(list.filter((...[, other]) => other !== index));
          }}
        >
          Remove
        </button>
      </div>
    ),
  };
}

export function TextListField(props: FieldProps<"text-list">) {
  const { field, path, form } = props;
  const controlId = useId();
  const edits = useListEdits({ ...props, listId: controlId });
  return (
    <fieldset className="list-field" id={controlId}>
      <legend>{field.label}</legend>
      {edits.list.map((...[item, index]) => {
        const itemId = `${controlId}-${String(index)}`;
        const issue = form.issueAt([...path, index]);
        return (
          <div className="list-item" key={index}>
            <div className="text-item">
              <input
                id={itemId}
                type="text"
                aria-label={`${field.itemLabel} ${String(index + 1)}`}
                value={typeof item === "string" ? item : ""}
                onBlur={form.flush}
                onChange={(event) => {
                  form.change({
                    path: [...path, index],
                    value: event.target.value,
                    timing: "after-pause",
                  });
                }}
                {...controlStateOf({ path: [...path, index], issue })}
              />
              {edits.actionsOf(index)}
            </div>
            <IssueLine path={[...path, index]} issue={issue} />
          </div>
        );
      })}
      <IssueLine path={path} issue={form.issueAt(path)} />
      {edits.addButton}
    </fieldset>
  );
}

export function ObjectListField(
  props: FieldProps<"object-list"> & { fieldOf: FieldRenderer },
) {
  const { field, path, form } = props;
  const controlId = useId();
  const edits = useListEdits({ ...props, listId: controlId });
  return (
    <fieldset className="list-field" id={controlId}>
      <legend>{field.label}</legend>
      {edits.list.map((...[, index]) => (
        <div className="list-item object-item" key={index}>
          <div className="object-item-head">
            <p>
              {field.itemLabel} {index + 1}
            </p>
            {edits.actionsOf(index)}
          </div>
          <div className="object-fields">
            {field.fields.map((subfield) => (
              <div key={subfield.name}>
                {props.fieldOf({
                  field: subfield,
                  path: [...path, index, subfield.name],
                })}
              </div>
            ))}
          </div>
          {field.fields.map((subfield) => (
            <IssueLine
              key={subfield.name}
              path={[...path, index, subfield.name]}
              issue={form.issueAt([...path, index, subfield.name])}
              label={subfield.label}
            />
          ))}
          <IssueLine
            path={[...path, index]}
            issue={form.issueAt([...path, index])}
          />
        </div>
      ))}
      <IssueLine path={path} issue={form.issueAt(path)} />
      {edits.addButton}
    </fieldset>
  );
}
