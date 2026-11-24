import type { z } from "zod";
import { barChartSchema } from "./barChart.js";
import { bulletListSchema } from "./bulletList.js";
import { captionWordsSchema } from "./captionWords.js";
import { chatSchema } from "./chat.js";
import { checklistSchema } from "./checklist.js";
import { compareSchema } from "./compare.js";
import { deviceSchema } from "./device.js";
import { endCardSchema } from "./endCard.js";
import { commandSchema } from "./film/command.js";
import { countsSchema } from "./film/counts.js";
import { footageSchema } from "./film/footage.js";
import { linesSchema } from "./film/lines.js";
import { lookSwapSchema } from "./film/lookSwap.js";
import { shapesSchema } from "./film/shapes.js";
import { wallSchema } from "./film/wall.js";
import { heroSchema } from "./hero.js";
import { imagePanSchema } from "./imagePan.js";
import { kineticSchema } from "./kinetic.js";
import { logoRevealSchema } from "./logoReveal.js";
import { lowerThirdSchema } from "./lowerThird.js";
import { quoteSchema } from "./quote.js";
import { splitSchema } from "./split.js";
import { statSchema } from "./stat.js";
import { stepsSchema } from "./steps.js";
import { titleCardSchema } from "./titleCard.js";
import { videoClipSchema } from "./videoClip.js";

export interface KitSceneSchema {
  purpose: string;
  props: z.ZodObject;
}

export const kitSceneSchemas = {
  "title-card": titleCardSchema,
  "bullet-list": bulletListSchema,
  "image-pan": imagePanSchema,
  "caption-words": captionWordsSchema,
  "bar-chart": barChartSchema,
  quote: quoteSchema,
  "video-clip": videoClipSchema,
  hero: heroSchema,
  stat: statSchema,
  compare: compareSchema,
  steps: stepsSchema,
  chat: chatSchema,
  device: deviceSchema,
  split: splitSchema,
  "logo-reveal": logoRevealSchema,
  checklist: checklistSchema,
  "end-card": endCardSchema,
  "lower-third": lowerThirdSchema,
  kinetic: kineticSchema,
  footage: footageSchema,
  wall: wallSchema,
  shapes: shapesSchema,
  lines: linesSchema,
  "look-swap": lookSwapSchema,
  command: commandSchema,
  counts: countsSchema,
} satisfies Record<string, KitSceneSchema>;
