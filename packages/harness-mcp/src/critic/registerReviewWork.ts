import type { HarnessContext } from "../context.js";
import { registerCheckMusic } from "../music/registerCheckMusic.js";
import { registerReviewClip } from "../storyPlan/registerReviewClip.js";
import { createCriticDesk } from "./criticDesk.js";
import type { AskCritic } from "./criticTypes.js";
import { registerCriticTools } from "./registerCriticTools.js";
import { registerReviewSheet } from "./sheet/registerReviewSheet.js";

export function registerReviewWork(
  context: HarnessContext & { askCritic: AskCritic | undefined },
): void {
  const reviewContext = { ...context, critics: createCriticDesk() };
  registerReviewClip(reviewContext);
  registerReviewSheet(reviewContext);
  registerCheckMusic(context);
  if (context.askCritic !== undefined) registerCriticTools(reviewContext);
}
