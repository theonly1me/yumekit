import { useState } from "react";
import type { ModelTarget } from "../../settings/services/index.js";
import type { MediaServers } from "../../tools/mediaServers.js";
import {
  firstChoiceOf,
  modelChoicesOf,
  pickedChoiceOf,
  type ModelChoice,
} from "../modelChoices.js";
import { priceOf, type Price } from "../price.js";
import {
  durationSettingName,
  valuesFor,
  type SettingValue,
  type SettingValues,
} from "../settingValues.js";

const inputOfKind = { image: "image_input", video: "video_input" } as const;

export function talkingSecondsOf(seconds: number): number {
  return Math.round(seconds * 10) / 10;
}

export function useTalkingChoice(options: {
  servers: MediaServers | undefined;
  kind: "image" | "video";
  seconds: number;
  pickedModel: ModelTarget | undefined;
}) {
  const { servers } = options;
  const [chosenKey, setChosenKey] = useState<string>();
  const [stored, setStored] = useState<{ key: string; values: SettingValues }>({
    key: "",
    values: {},
  });
  const talkingChoices =
    servers === undefined
      ? []
      : modelChoicesOf({ servers, capability: "talking-clip" }).filter(
          (candidate) =>
            candidate.model.accepts?.includes(inputOfKind[options.kind]) ===
            true,
        );
  const choice =
    talkingChoices.find((candidate) => candidate.key === chosenKey) ??
    pickedChoiceOf({
      choices: talkingChoices,
      picked: options.pickedModel,
    }) ??
    firstChoiceOf(talkingChoices);
  const withLength = (values: SettingValues): SettingValues => ({
    ...values,
    [durationSettingName]: talkingSecondsOf(options.seconds),
  });
  const valuesOf = (candidate: ModelChoice): SettingValues =>
    withLength(
      candidate.key === stored.key
        ? stored.values
        : valuesFor({
            model: candidate.model,
            previous: stored.values,
            preferredSeconds: options.seconds,
          }),
    );
  const values = choice === undefined ? {} : valuesOf(choice);

  const choose = (key: string) => {
    setChosenKey(key);
  };
  const change = (change: { name: string; value: SettingValue }) => {
    if (choice === undefined) return;
    setStored({
      key: choice.key,
      values: { ...values, [change.name]: change.value },
    });
  };
  const priceFor = (candidate: ModelChoice): Price =>
    priceOf({ model: candidate.model, values: valuesOf(candidate) });

  return { talkingChoices, choice, values, choose, change, priceFor };
}
