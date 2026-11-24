export const chatModelVariable = "YUMEKIT_CODEX_MODEL";
export const reasoningEffortVariable = "YUMEKIT_CODEX_EFFORT";

export interface ChatSettings {
  model: string | undefined;
  effort: string | undefined;
}

const modelRefusal = /not supported|not found|model_not_found|does not exist/i;
const effortRefusal = /reasoning|effort/i;

function valueOf(text: string | undefined): string | undefined {
  const trimmed = text?.trim() ?? "";
  return trimmed === "" ? undefined : trimmed;
}

export function chatSettingsOf(environment: NodeJS.ProcessEnv): ChatSettings {
  return {
    model: valueOf(environment[chatModelVariable]),
    effort: valueOf(environment[reasoningEffortVariable]),
  };
}

export function chatSettingArgumentsOf(settings: ChatSettings): string[] {
  return [
    ...(settings.model === undefined ? [] : ["-m", settings.model]),
    ...(settings.effort === undefined
      ? []
      : ["-c", `model_reasoning_effort=${JSON.stringify(settings.effort)}`]),
  ];
}

export function refusedSettingTextOf(options: {
  message: string;
  settings: ChatSettings;
}): string | undefined {
  const { message, settings } = options;
  if (
    settings.model !== undefined &&
    message.includes(settings.model) &&
    modelRefusal.test(message)
  ) {
    return `Codex refused the chat model "${settings.model}" that the setting ${chatModelVariable} names: ${message} Set ${chatModelVariable} to a model of your ChatGPT plan, or remove it to use the default model of Codex.`;
  }
  if (settings.effort !== undefined && effortRefusal.test(message)) {
    return `Codex refused the reasoning effort "${settings.effort}" that the setting ${reasoningEffortVariable} names: ${message} Set ${reasoningEffortVariable} to a level of the model, or remove it to use the default of Codex.`;
  }
  return undefined;
}
