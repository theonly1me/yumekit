import { priceOf, priceText } from "../makeClip/price.js";
import {
  currentModelOf,
  type MediaChoicesState,
  type ModelTarget,
} from "../settings/services/index.js";
import type { MediaServersState } from "../tools/useMediaServers.js";
import type { MediaModel } from "../tools/mediaServers.js";

const sampleServer = "sample";

export interface SharperChoice {
  target: ModelTarget;
  model: MediaModel;
  isTestService: boolean;
}

export function sharperChoiceOf(options: {
  choices: MediaChoicesState;
  servers: MediaServersState;
}): SharperChoice | undefined {
  const { choices, servers } = options;
  if (choices.kind !== "ready" || servers.kind !== "ready") return undefined;
  const current = choices.choices.choices.find(
    (choice) => choice.capability === "sharper",
  )?.current;
  if (current === null || current?.state !== "ready") return undefined;
  const target = currentModelOf({ state: choices, kind: "sharper" });
  if (target === undefined) return undefined;
  const server = servers.servers.servers.find(
    (each) => each.server === target.server,
  );
  const models = (server?.models ?? []).filter(
    (each) => each.capability === "sharper",
  );
  const model =
    models.find((each) => each.id === target.model) ??
    models.find((each) => each.is_default);
  if (model?.accepts?.includes("video_input") !== true) return undefined;
  return { target, model, isTestService: target.server === sampleServer };
}

export function sharperPriceText(options: {
  choice: SharperChoice;
  seconds: number;
}): string {
  const price = priceOf({
    model: options.choice.model,
    values: { duration_seconds: options.seconds },
  });
  const text =
    price.kind === "not-known" ? "Price not known" : priceText(price);
  return `2 times wider and taller. ${text}.`;
}
