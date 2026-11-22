import { useState } from "react";
import type { MediaServers } from "../tools/mediaServers.js";
import {
  firstChoiceOf,
  modelChoicesOf,
  type ModelChoice,
} from "./modelChoices.js";
import { priceOf, type Price } from "./price.js";
import {
  valuesFor,
  type SettingValue,
  type SettingValues,
} from "./settingValues.js";

export function useClipChoice(options: {
  servers: MediaServers | undefined;
  preferredSeconds: number;
}) {
  const { servers, preferredSeconds } = options;
  const [chosenKey, setChosenKey] = useState<string>();
  const [stored, setStored] = useState<{ key: string; values: SettingValues }>({
    key: "",
    values: {},
  });
  const videoChoices =
    servers === undefined
      ? []
      : modelChoicesOf({ servers, capability: "video" });
  const imageChoices =
    servers === undefined
      ? []
      : modelChoicesOf({ servers, capability: "image" }).filter(
          (choice) => choice.isReady,
        );
  const choice =
    videoChoices.find((candidate) => candidate.key === chosenKey) ??
    firstChoiceOf(videoChoices);
  const values =
    choice === undefined
      ? {}
      : stored.key === choice.key
        ? stored.values
        : valuesFor({
            model: choice.model,
            previous: stored.values,
            preferredSeconds,
          });

  const choose = (key: string) => {
    const next = videoChoices.find((candidate) => candidate.key === key);
    if (next === undefined) return;
    setChosenKey(key);
    setStored({
      key,
      values: valuesFor({
        model: next.model,
        previous: values,
        preferredSeconds,
      }),
    });
  };
  const change = (change: { name: string; value: SettingValue }) => {
    if (choice === undefined) return;
    setStored({
      key: choice.key,
      values: { ...values, [change.name]: change.value },
    });
  };

  const priceFor = (candidate: ModelChoice): Price =>
    priceOf({
      model: candidate.model,
      values:
        candidate.key === choice?.key
          ? values
          : valuesFor({
              model: candidate.model,
              previous: values,
              preferredSeconds,
            }),
    });

  return {
    videoChoices,
    imageChoices,
    choice,
    values,
    choose,
    change,
    priceFor,
  };
}
