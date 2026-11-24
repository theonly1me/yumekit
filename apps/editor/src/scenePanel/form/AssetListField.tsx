import { useId } from "react";
import { AssetField } from "./ChoiceFields.js";
import { IssueLine } from "./FieldFrame.js";
import type { FieldProps } from "./formBinding.js";
import { useListEdits } from "./ListFields.js";

export function AssetListField(props: FieldProps<"asset-list">) {
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
          <AssetField
            field={{
              kind: "asset",
              name: String(index),
              label: "File",
              isRequired: true,
              assetKinds: field.assetKinds,
            }}
            path={[...path, index]}
            form={{ ...form, isIssueBelowRow: true }}
          />
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
