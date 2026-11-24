import { AssetListField } from "./AssetListField.js";
import { AssetField, ChoiceField, SwitchField } from "./ChoiceFields.js";
import { IssueLine } from "./FieldFrame.js";
import type { Field } from "./fields.js";
import type { FieldProps, FormBinding } from "./formBinding.js";
import { ObjectListField, TextListField } from "./ListFields.js";
import { isJsonObject, withValueAt, type PropPath } from "./propPath.js";
import { NumberField } from "./NumberField.js";
import { TextField } from "./TextFields.js";

function isEmptyGroup(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((child) => child === "" || child === undefined)
  );
}

function GroupField(props: FieldProps<"group">) {
  const { field, path, form } = props;
  const groupForm: FormBinding = {
    ...form,
    change: (change) => {
      const current = form.valueAt(path);
      const next = withValueAt({
        value: isJsonObject(current) ? current : {},
        path: change.path.slice(path.length),
        next: change.value,
      });
      form.change({
        path,
        value: !field.isRequired && isEmptyGroup(next) ? undefined : next,
        timing: change.timing,
      });
    },
  };
  return (
    <fieldset className="group-field">
      <legend>{field.label}</legend>
      <div className="group-fields">
        {field.fields.map((subfield) => (
          <FieldView
            key={subfield.name}
            field={subfield}
            path={[...path, subfield.name]}
            form={groupForm}
          />
        ))}
      </div>
      <IssueLine path={path} issue={form.issueAt(path)} />
    </fieldset>
  );
}

export function FieldView(props: {
  field: Field;
  path: PropPath;
  form: FormBinding;
}) {
  const { field, path, form } = props;
  switch (field.kind) {
    case "text":
      return <TextField field={field} path={path} form={form} />;
    case "number":
      return <NumberField field={field} path={path} form={form} />;
    case "choice":
      return <ChoiceField field={field} path={path} form={form} />;
    case "switch":
      return <SwitchField field={field} path={path} form={form} />;
    case "asset":
      return <AssetField field={field} path={path} form={form} />;
    case "text-list":
      return <TextListField field={field} path={path} form={form} />;
    case "asset-list":
      return <AssetListField field={field} path={path} form={form} />;
    case "group":
      return <GroupField field={field} path={path} form={form} />;
    case "object-list":
      return (
        <ObjectListField
          field={field}
          path={path}
          form={form}
          fieldOf={(options) => (
            <FieldView {...options} form={{ ...form, isIssueBelowRow: true }} />
          )}
        />
      );
  }
}
