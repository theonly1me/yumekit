import { useId } from "react";
import { controlStateOf, FieldFrame, IssueLine } from "./FieldFrame.js";
import { labelOf } from "./fields.js";
import type { FieldProps } from "./formBinding.js";
import type { PropPath } from "./propPath.js";

const noChoice = "";

const assetNouns = {
  image: { one: "an image", many: "images" },
  audio: { one: "an audio file", many: "audio files" },
  video: { one: "a video", many: "videos" },
} as const;

function emptyAssetLabelOf(options: {
  assetKinds: readonly (keyof typeof assetNouns)[];
  hasAssets: boolean;
  isRequired: boolean;
}): string {
  const nouns = options.assetKinds.map((assetKind) => assetNouns[assetKind]);
  if (!options.hasAssets) {
    return `This project has no ${nouns.map((noun) => noun.many).join(" or ")}`;
  }
  return options.isRequired
    ? `Pick ${nouns.map((noun) => noun.one).join(" or ")}`
    : "None";
}

function ChoiceSelect(props: {
  controlId: string;
  path: PropPath;
  isIssueBelowRow: boolean | undefined;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  emptyLabel: string;
  isRequired: boolean;
  issue: string | undefined;
  onChoose: (value: string | undefined) => void;
}) {
  const { controlId, value, options, issue } = props;
  const isKnown = options.some((option) => option.value === value);
  return (
    <FieldFrame
      controlId={controlId}
      path={props.path}
      label={props.label}
      issue={issue}
      isIssueBelowRow={props.isIssueBelowRow}
    >
      <select
        id={controlId}
        value={value}
        onChange={(event) => {
          const chosen = event.target.value;
          props.onChoose(chosen === noChoice ? undefined : chosen);
        }}
        {...controlStateOf({ path: props.path, issue })}
      >
        {props.isRequired && value !== noChoice ? undefined : (
          <option value={noChoice} disabled={props.isRequired}>
            {props.emptyLabel}
          </option>
        )}
        {isKnown || value === noChoice ? undefined : (
          <option value={value}>{value}, not in this project</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

export function ChoiceField(props: FieldProps<"choice">) {
  const { field, path, form } = props;
  const controlId = useId();
  const value = form.valueAt(path);
  return (
    <ChoiceSelect
      controlId={controlId}
      path={path}
      isIssueBelowRow={form.isIssueBelowRow}
      label={field.label}
      value={typeof value === "string" ? value : noChoice}
      options={field.options.map((option) => ({
        value: option,
        label: labelOf(option),
      }))}
      emptyLabel="Default"
      isRequired={field.isRequired}
      issue={form.issueAt(path)}
      onChoose={(chosen) => {
        form.change({ path, value: chosen, timing: "now" });
      }}
    />
  );
}

export function AssetField(props: FieldProps<"asset">) {
  const { field, path, form } = props;
  const controlId = useId();
  const value = form.valueAt(path);
  const assets = form.assets.filter((asset) =>
    field.assetKinds.some((assetKind) => assetKind === asset.kind),
  );
  return (
    <ChoiceSelect
      controlId={controlId}
      path={path}
      isIssueBelowRow={form.isIssueBelowRow}
      label={field.label}
      value={typeof value === "string" ? value : noChoice}
      options={assets.map((asset) => ({ value: asset.id, label: asset.id }))}
      emptyLabel={emptyAssetLabelOf({
        assetKinds: field.assetKinds,
        hasAssets: assets.length > 0,
        isRequired: field.isRequired,
      })}
      isRequired={field.isRequired}
      issue={form.issueAt(path)}
      onChoose={(chosen) => {
        form.change({ path, value: chosen, timing: "now" });
      }}
    />
  );
}

export function SwitchField(props: FieldProps<"switch">) {
  const { field, path, form } = props;
  const controlId = useId();
  const issue = form.issueAt(path);
  return (
    <div className="field switch-field">
      <label htmlFor={controlId}>
        <input
          id={controlId}
          type="checkbox"
          role="switch"
          checked={form.valueAt(path) === true}
          onChange={(event) => {
            form.change({
              path,
              value: event.target.checked,
              timing: "now",
            });
          }}
          {...controlStateOf({ path, issue })}
        />
        {field.label}
      </label>
      {form.isIssueBelowRow === true ? undefined : (
        <IssueLine path={path} issue={issue} />
      )}
    </div>
  );
}
