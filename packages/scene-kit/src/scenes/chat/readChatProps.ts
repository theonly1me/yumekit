import type { JsonObject } from "@yumekit/scene";
import { readField, shortenText } from "../../props/readField.js";
import { chatLimits, chatSchema } from "../../schemas/chat.js";

export function readChatProps(props: JsonObject) {
  const { shape } = chatSchema.props;
  const names = readField({
    field: shape.names,
    value: props["names"],
    fallback: undefined,
  });
  return {
    request: readField({
      field: shape.request,
      value: props["request"],
      fallback: "Question",
      repair: shortenText(chatLimits.request),
    }),
    answer: readField({
      field: shape.answer,
      value: props["answer"],
      fallback: "Answer",
      repair: shortenText(chatLimits.answer),
    }),
    requestName: names?.request,
    answerName: names?.answer,
  };
}
