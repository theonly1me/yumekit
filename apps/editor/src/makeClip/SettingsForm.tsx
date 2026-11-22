import type { ModelSetting } from "../tools/mediaServers.js";
import type { SettingValue, SettingValues } from "./settingValues.js";

const longestRange = 120;
const referenceSetting = "reference_image_paths";

type Change = (change: { name: string; value: SettingValue }) => void;

function SettingField(props: {
  setting: ModelSetting;
  value: SettingValue | undefined;
  onChange: Change;
}) {
  const { setting, value, onChange } = props;
  const id = `clip-setting-${setting.name}`;
  if (setting.kind === "choice") {
    return (
      <div className="field">
        <span className="field-label" id={id}>
          {setting.label}
        </span>
        <div className="segments" role="group" aria-labelledby={id}>
          {setting.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={choice === value}
              onClick={() => {
                onChange({ name: setting.name, value: choice });
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (setting.kind === "whole-number") {
    const number = typeof value === "number" ? value : setting.default;
    const isRange = setting.maximum - setting.minimum <= longestRange;
    return (
      <div className="field">
        <label htmlFor={id}>
          {setting.label}
          {isRange ? (
            <>
              , <output htmlFor={id}>{number}</output>
            </>
          ) : undefined}
        </label>
        <input
          type={isRange ? "range" : "number"}
          id={id}
          min={setting.minimum}
          max={setting.maximum}
          step={1}
          value={number}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isInteger(next))
              onChange({ name: setting.name, value: next });
          }}
        />
      </div>
    );
  }
  if (setting.kind === "switch") {
    return (
      <label className="toggle">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => {
            onChange({ name: setting.name, value: event.target.checked });
          }}
        />
        {setting.label}
      </label>
    );
  }
  return undefined;
}

function ReferencePicks(props: {
  label: string;
  maximum: number;
  imageIds: string[];
  chosenIds: string[];
  onChoose: (assetIds: string[]) => void;
}) {
  const { chosenIds } = props;
  if (props.imageIds.length === 0) return undefined;
  return (
    <fieldset className="reference-picks">
      <legend>
        {props.label}, up to {props.maximum}
      </legend>
      {props.imageIds.map((assetId) => {
        const isChosen = chosenIds.includes(assetId);
        return (
          <label key={assetId}>
            <input
              type="checkbox"
              checked={isChosen}
              disabled={!isChosen && chosenIds.length >= props.maximum}
              onChange={() => {
                props.onChoose(
                  isChosen
                    ? chosenIds.filter((id) => id !== assetId)
                    : [...chosenIds, assetId],
                );
              }}
            />
            {assetId}
          </label>
        );
      })}
    </fieldset>
  );
}

export function SettingsForm(props: {
  settings: ModelSetting[];
  values: SettingValues;
  onChange: Change;
  imageIds: string[];
  referenceIds: string[];
  onReferences: (assetIds: string[]) => void;
}) {
  return (
    <>
      {props.settings.map((setting) =>
        setting.kind === "image-files" && setting.name === referenceSetting ? (
          <ReferencePicks
            key={setting.name}
            label={setting.label}
            maximum={setting.maximum}
            imageIds={props.imageIds}
            chosenIds={props.referenceIds}
            onChoose={props.onReferences}
          />
        ) : (
          <SettingField
            key={setting.name}
            setting={setting}
            value={props.values[setting.name]}
            onChange={props.onChange}
          />
        ),
      )}
    </>
  );
}
