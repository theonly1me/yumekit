import type { AgentId, RunAccess } from "./brainTypes.js";
import { instructionsOf, lockedToolsLine } from "./instructions.js";

export const programToolsRules = [
  "You can also use the tools of your program on this computer: look at a web page, run a command, read a file, or record the screen with a tool that you have.",
  "Every change to the project goes through the yumekit tools. Never write, move, or remove a file of the project yourself: project.json, bible.json, script.md, the folders scenes and timelines, assets/index.json, takes.json, and the folder .yumekit. You may read them.",
  "To bring in a file that you made, such as a screen recording or a picture of a web page, save it in a temporary folder, then call import_asset.",
  "Never read, print, or send a key. The folder of the yumekit keys is closed to you.",
  "When an action needs the yes of the person, such as a read outside the project folder, just do it: the person gets a card in the chat to allow it. Never ask for a permission in your text. If the person does not allow it, do not try it again, and say in one sentence what you could not do.",
].join("\n");

export function leadInstructionsOf(options: {
  agentId: AgentId;
  access: RunAccess | undefined;
}): string {
  const locked = instructionsOf(options.agentId);
  return options.access?.kind === "program"
    ? locked.replace(lockedToolsLine, programToolsRules)
    : locked;
}
