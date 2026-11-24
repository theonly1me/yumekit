import type { JsonObject } from "@yumekit/scene";
import { readField, shortenText } from "../../../props/readField.js";
import { commandLimits, commandSchema } from "../../../schemas/film/command.js";

export function readCommandProps(props: JsonObject) {
  const { shape } = commandSchema.props;
  return {
    command: readField({
      field: shape.command,
      value: props["command"],
      fallback: "command",
      repair: shortenText(commandLimits.command),
    }),
    heading: readField({
      field: shape.heading,
      value: props["heading"],
      fallback: undefined,
      repair: shortenText(commandLimits.heading),
    }),
    prompt: readField({
      field: shape.prompt,
      value: props["prompt"],
      fallback: undefined,
      repair: shortenText(commandLimits.prompt),
    }),
    note: readField({
      field: shape.note,
      value: props["note"],
      fallback: undefined,
      repair: shortenText(commandLimits.note),
    }),
  };
}
