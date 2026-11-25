import type { ModelChoice } from "@yumekit/brain";
import type { AiRole } from "./settings.js";

export const roleNames: Record<AiRole, string> = {
  lead: "The AI that makes the film",
  critic: "The AI that checks the work",
};

const longestMessage = 300;

const effortRefusal = /effort|reasoning|invalid value|supported values/i;

function shortened(message: string): string {
  const trimmed = message.trim();
  return trimmed.length <= longestMessage
    ? trimmed
    : `${trimmed.slice(0, longestMessage).trimEnd()}...`;
}

export function refusedChoiceTextOf(options: {
  message: string;
  choice: ModelChoice;
  role: AiRole;
  programName: string;
}): string | undefined {
  const { message, choice, programName } = options;
  const where = `Settings chose for "${roleNames[options.role]}"`;
  const said = `${programName} said: ${shortened(message)}`;
  const { model, effort } = choice;
  if (
    model !== undefined &&
    message.includes(model) &&
    /model/i.test(message)
  ) {
    return `${programName} refused the model "${model}" that ${where}. ${said} Open Settings, then AI, and pick another model, or leave the model empty so that ${programName} uses its own.`;
  }
  if (
    effort !== undefined &&
    message.includes(effort) &&
    effortRefusal.test(message)
  ) {
    return `${programName} refused the effort "${effort}" that ${where}. ${said} Open Settings, then AI, and pick another effort, or let ${programName} decide.`;
  }
  return undefined;
}
