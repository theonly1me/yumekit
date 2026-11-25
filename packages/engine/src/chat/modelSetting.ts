import {
  agentModelOptions,
  brainAgentIds,
  type AgentId,
  type ModelChoice,
} from "@yumekit/brain";
import { agentCatalog } from "../agents/agentCatalog.js";
import type { Outcome } from "../engineTypes.js";
import {
  changeSettingsFile,
  type AgentSettingFailure,
} from "./agentSetting.js";
import {
  readChatSettings,
  type AiRole,
  type ChatSettings,
} from "./settings.js";

export interface AgentModels {
  id: AgentId;
  name: string;
  models: readonly string[];
  efforts: readonly string[];
  lead: ModelChoice;
  critic: ModelChoice;
}

export interface ModelChange {
  agent: AgentId;
  role: AiRole;
  model: string | undefined;
  effort: string | undefined;
}

export type ModelSettingFailure =
  AgentSettingFailure | { kind: "effort-not-known"; message: string };

function agentModelsOf(options: {
  settings: ChatSettings;
  agentId: AgentId;
}): AgentModels {
  const { agentId } = options;
  const chosen = options.settings.models?.[agentId];
  return {
    id: agentId,
    name: agentCatalog[agentId].name,
    ...agentModelOptions[agentId],
    lead: chosen?.lead ?? {},
    critic: chosen?.critic ?? {},
  };
}

function notValid(file: string): ModelSettingFailure {
  return {
    kind: "settings-not-valid",
    message: `The settings file ${file} is not valid. Correct it or remove it.`,
  };
}

export async function readAiModels(): Promise<
  Outcome<AgentModels[], ModelSettingFailure>
> {
  const settings = await readChatSettings();
  if (!settings.ok)
    return { ok: false, failure: notValid(settings.failure.file) };
  return {
    ok: true,
    value: brainAgentIds.map((agentId) =>
      agentModelsOf({ settings: settings.value, agentId }),
    ),
  };
}

function effortFailureOf(change: ModelChange): ModelSettingFailure | undefined {
  const { efforts } = agentModelOptions[change.agent];
  if (change.effort === undefined || efforts.includes(change.effort)) {
    return undefined;
  }
  const name = agentCatalog[change.agent].name;
  return {
    kind: "effort-not-known",
    message:
      efforts.length === 0
        ? `${name} has no effort setting.`
        : `${name} takes one of these efforts: ${efforts.join(", ")}.`,
  };
}

function choiceOf(change: ModelChange): ModelChoice {
  return {
    ...(change.model === undefined ? {} : { model: change.model }),
    ...(change.effort === undefined ? {} : { effort: change.effort }),
  };
}

let lastSave: Promise<unknown> = Promise.resolve();

export function saveAiModel(
  change: ModelChange,
): Promise<Outcome<AgentModels, ModelSettingFailure>> {
  const saving = lastSave.then(
    () => writeAiModel(change),
    () => writeAiModel(change),
  );
  lastSave = saving;
  return saving;
}

async function writeAiModel(
  change: ModelChange,
): Promise<Outcome<AgentModels, ModelSettingFailure>> {
  const effortFailure = effortFailureOf(change);
  if (effortFailure !== undefined) return { ok: false, failure: effortFailure };
  const settings = await readChatSettings();
  if (!settings.ok)
    return { ok: false, failure: notValid(settings.failure.file) };
  const models = settings.value.models ?? {};
  const next: ChatSettings = {
    ...settings.value,
    models: {
      ...models,
      [change.agent]: {
        ...models[change.agent],
        [change.role]: choiceOf(change),
      },
    },
  };
  return changeSettingsFile({
    change: (fields) => ({
      fields: { ...fields, models: next.models },
      value: agentModelsOf({ settings: next, agentId: change.agent }),
    }),
  });
}
