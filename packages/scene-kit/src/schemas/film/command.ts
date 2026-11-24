import { z } from "zod";

export const commandLimits = {
  command: 60,
  heading: 40,
  note: 100,
  prompt: 3,
} as const;

export const commandSchema = {
  purpose:
    "The end of a film: a wordmark or a short line, a command that types itself in a pill with a cursor, and an optional small note. For an install command or a web address.",
  props: z.strictObject({
    command: z
      .string()
      .min(1)
      .max(commandLimits.command)
      .describe(
        "The command or the address to type, for example npm install -g yumekit.",
      ),
    heading: z
      .string()
      .min(1)
      .max(commandLimits.heading)
      .optional()
      .describe("A wordmark or a short line above the command."),
    prompt: z
      .string()
      .min(1)
      .max(commandLimits.prompt)
      .optional()
      .describe(
        "A sign before the command, for example $, only when the person asks for one. None by default.",
      ),
    note: z
      .string()
      .min(1)
      .max(commandLimits.note)
      .optional()
      .describe("An optional small line under the command."),
  }),
};
