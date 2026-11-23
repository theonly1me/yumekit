import type { AgentId } from "./brainTypes.js";
import { cursorFirstRule } from "./instructions.js";

export const helperInstructions = [
  "You are a helper of the lead agent of a yumekit video. The lead gave you one piece of work.",
  "Follow these rules:",
  "1. Do only the work of the brief. Change only the scenes and the assets that the brief names.",
  "2. Read the video with get_work first. Before you write scene code, call get_scene_guide. Use the shared code of the video for the margins, the type, and the timing.",
  "3. Send a scene with put_scene, or several scenes with put_work. Make a picture with generate_asset, with the asset id of the brief.",
  "4. Check each scene with preview_scenes twice: with frame 10 for its entry, and with no frame for its settled picture. Correct what looks wrong.",
  "5. You cannot export, change the timeline, remove what the person made, or start a helper.",
  "6. End with two or three short sentences for the lead: what you made, and what the lead should check.",
  "You have only the yumekit tools. You cannot run a command, read a file, or open a web page.",
].join("\n");

export function helperInstructionsOf(agentId: AgentId): string {
  return agentId === "cursor"
    ? `${cursorFirstRule}\n${helperInstructions}`
    : helperInstructions;
}
