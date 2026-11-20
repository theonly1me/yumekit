import type { z } from "zod";
import { barChartSchema } from "./barChart.js";
import { bulletListSchema } from "./bulletList.js";
import { captionWordsSchema } from "./captionWords.js";
import { imagePanSchema } from "./imagePan.js";
import { quoteSchema } from "./quote.js";
import { titleCardSchema } from "./titleCard.js";

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
} satisfies Record<string, KitSceneSchema>;
