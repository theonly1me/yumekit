import type { AiRole } from "./aiModelRequests.js";

export const roleTexts: Record<AiRole, { name: string; about: string }> = {
  lead: {
    name: "The AI that makes the film",
    about: "It writes the story, plans the shots, and builds the video.",
  },
  critic: {
    name: "The AI that checks the work",
    about:
      "It looks at each picture and clip, and says what to keep and what to make again.",
  },
};

const effortLabels: Record<string, string> = {
  none: "None: no extra thinking",
  minimal: "Minimal",
  low: "Low: fastest",
  medium: "Medium",
  high: "High",
  xhigh: "Extra high",
  max: "Max: slowest and most careful",
};

export function effortLabelOf(effort: string): string {
  return effortLabels[effort] ?? effort;
}

export function choicesHelpOf(options: {
  programName: string;
  hasEfforts: boolean;
}): string {
  const { programName } = options;
  const effort = options.hasEfforts
    ? " Effort is how long the AI thinks before it acts. More effort is slower and uses more of your plan."
    : ` ${programName} has no effort setting.`;
  return `The model is the AI brain that ${programName} uses. Leave it empty, and ${programName} picks its own.${effort} A change applies to the next request.`;
}
