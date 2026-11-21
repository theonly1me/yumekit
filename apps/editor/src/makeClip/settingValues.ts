import type { MediaModel, ModelSetting } from "../tools/mediaServers.js";

export type SettingValue = string | number | boolean;
export type SettingValues = Record<string, SettingValue>;

export const durationSettingName = "duration_seconds";

function clamped(options: {
  value: number;
  setting: { minimum: number; maximum: number };
}): number {
  const { value, setting } = options;
  return Math.min(
    setting.maximum,
    Math.max(setting.minimum, Math.round(value)),
  );
}

function valueOf(options: {
  setting: ModelSetting;
  previous: SettingValue | undefined;
  preferredSeconds: number;
}): SettingValue | undefined {
  const { setting, previous } = options;
  if (setting.kind === "choice") {
    return typeof previous === "string" && setting.choices.includes(previous)
      ? previous
      : setting.default;
  }
  if (setting.kind === "whole-number") {
    if (typeof previous === "number") {
      return clamped({ value: previous, setting });
    }
    return setting.name === durationSettingName
      ? clamped({ value: options.preferredSeconds, setting })
      : setting.default;
  }
  if (setting.kind === "switch") {
    return typeof previous === "boolean" ? previous : setting.default;
  }
  return undefined;
}

export function valuesFor(options: {
  model: MediaModel;
  previous: SettingValues;
  preferredSeconds: number;
}): SettingValues {
  const values: SettingValues = {};
  for (const setting of options.model.settings) {
    const value = valueOf({
      setting,
      previous: options.previous[setting.name],
      preferredSeconds: options.preferredSeconds,
    });
    if (value !== undefined) values[setting.name] = value;
  }
  return values;
}

export function secondsOf(values: SettingValues): number | undefined {
  const seconds = values[durationSettingName];
  return typeof seconds === "number" ? seconds : undefined;
}
