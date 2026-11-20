import type { JsonObject } from "@yumekit/scene";
import {
  barChartBar,
  barChartLimits,
  barChartSchema,
} from "../schemas/barChart.js";
import {
  bulletListItem,
  bulletListLimits,
  bulletListSchema,
} from "../schemas/bulletList.js";
import { captionWordsSchema } from "../schemas/captionWords.js";
import { imagePanLimits, imagePanSchema } from "../schemas/imagePan.js";
import { quoteLimits, quoteSchema } from "../schemas/quote.js";
import { titleCardLimits, titleCardSchema } from "../schemas/titleCard.js";
import { keepValidItems, readField, shortenText } from "./readField.js";

export const defaultTexts = {
  heading: "Title",
  item: "Point",
  quote: "Quote",
  barLabel: "Value",
} as const;

export function readTitleCardProps(props: JsonObject) {
  const { shape } = titleCardSchema.props;
  return {
    heading: readField({
      field: shape.heading,
      value: props["heading"],
      fallback: defaultTexts.heading,
      repair: shortenText(titleCardLimits.heading),
    }),
    subheading: readField({
      field: shape.subheading,
      value: props["subheading"],
      fallback: undefined,
      repair: shortenText(titleCardLimits.subheading),
    }),
  };
}

export function readBulletListProps(props: JsonObject) {
  const { shape } = bulletListSchema.props;
  return {
    heading: readField({
      field: shape.heading,
      value: props["heading"],
      fallback: undefined,
      repair: shortenText(bulletListLimits.heading),
    }),
    items: readField({
      field: shape.items,
      value: props["items"],
      fallback: [defaultTexts.item],
      repair: keepValidItems({
        item: bulletListItem,
        maxItems: bulletListLimits.items,
      }),
    }),
  };
}

export function readImagePanProps(props: JsonObject) {
  const { shape } = imagePanSchema.props;
  return {
    assetId: readField({
      field: shape.assetId,
      value: props["assetId"],
      fallback: "",
    }),
    caption: readField({
      field: shape.caption,
      value: props["caption"],
      fallback: undefined,
      repair: shortenText(imagePanLimits.caption),
    }),
    direction: readField({
      field: shape.direction,
      value: props["direction"],
      fallback: undefined,
    }),
  };
}

export function readCaptionWordsProps(props: JsonObject) {
  const { shape } = captionWordsSchema.props;
  return {
    assetId: readField({
      field: shape.assetId,
      value: props["assetId"],
      fallback: undefined,
    }),
    text: readField({
      field: shape.text,
      value: props["text"],
      fallback: undefined,
    }),
  };
}

export function readBarChartProps(props: JsonObject) {
  const { shape } = barChartSchema.props;
  return {
    heading: readField({
      field: shape.heading,
      value: props["heading"],
      fallback: undefined,
      repair: shortenText(barChartLimits.heading),
    }),
    bars: readField({
      field: shape.bars,
      value: props["bars"],
      fallback: [{ label: defaultTexts.barLabel, value: 1 }],
      repair: keepValidItems({
        item: barChartBar,
        maxItems: barChartLimits.bars,
      }),
    }),
    valuePrefix: readField({
      field: shape.valuePrefix,
      value: props["valuePrefix"],
      fallback: undefined,
    }),
    valueSuffix: readField({
      field: shape.valueSuffix,
      value: props["valueSuffix"],
      fallback: undefined,
    }),
  };
}

export function readQuoteProps(props: JsonObject) {
  const { shape } = quoteSchema.props;
  return {
    quote: readField({
      field: shape.quote,
      value: props["quote"],
      fallback: defaultTexts.quote,
      repair: shortenText(quoteLimits.quote),
    }),
    source: readField({
      field: shape.source,
      value: props["source"],
      fallback: undefined,
      repair: shortenText(quoteLimits.source),
    }),
  };
}
