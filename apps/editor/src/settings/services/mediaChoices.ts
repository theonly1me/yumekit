import { z } from "zod";
import type { EngineClient } from "../../engine/engineClient.js";

const kindSchema = z.enum([
  "image",
  "speech",
  "music",
  "video",
  "sound-effect",
  "talking-clip",
  "sharper",
]);

const keySchema = z.object({
  variable: z.string(),
  label: z.string(),
  get_key_url: z.string(),
  steps: z.array(z.string()),
  source: z.enum(["environment", "key-file", "missing"]),
});

const serviceSchema = z.object({
  server: z.string(),
  label: z.string(),
  state: z.enum(["ready", "needs-key"]),
  keys: z.array(keySchema),
  models: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      is_default: z.boolean(),
      download: z
        .object({ bytes: z.number(), ready: z.boolean() })
        .nullable()
        .default(null),
    }),
  ),
});

const currentSchema = z.object({
  server: z.string(),
  server_label: z.string(),
  model: z.string().nullable(),
  model_label: z.string().nullable(),
  source: z.enum(["picked", "first-ready"]),
  state: z.enum(["ready", "needs-key", "not-available"]),
});

const choiceSchema = z.object({
  capability: kindSchema,
  current: currentSchema.nullable(),
  services: z.array(serviceSchema),
});

export const mediaChoicesSchema = z.object({
  choices: z.array(choiceSchema),
  failed_servers: z.array(
    z.object({ server: z.string(), message: z.string() }),
  ),
});

export type MediaKind = z.infer<typeof kindSchema>;
export type MediaChoices = z.infer<typeof mediaChoicesSchema>;
export type MediaChoice = z.infer<typeof choiceSchema>;
export type ChoiceService = z.infer<typeof serviceSchema>;
export type CurrentPick = z.infer<typeof currentSchema>;

export interface ModelTarget {
  server: string;
  serverLabel: string;
  model: string | undefined;
  modelLabel: string | undefined;
}

export const kindNames: Record<MediaKind, string> = {
  image: "Pictures",
  speech: "Voice",
  music: "Music",
  video: "Video clips",
  "sound-effect": "Sounds",
  "talking-clip": "Talking clips",
  sharper: "Sharper copy",
};

export function mediaChoiceRequests(client: EngineClient) {
  return {
    list: () =>
      client.readJson({
        path: "/api/media/choices",
        schema: mediaChoicesSchema,
      }),
    pick: (options: { kind: MediaKind; target: ModelTarget | undefined }) =>
      client.readJson({
        path: "/api/media/defaults",
        method: "PUT",
        schema: mediaChoicesSchema,
        body:
          options.target === undefined
            ? { capability: options.kind }
            : {
                capability: options.kind,
                server: options.target.server,
                ...(options.target.model === undefined
                  ? {}
                  : { model: options.target.model }),
              },
      }),
  };
}

export function choiceOf(options: {
  choices: MediaChoices;
  kind: MediaKind;
}): MediaChoice | undefined {
  return options.choices.choices.find(
    (choice) => choice.capability === options.kind,
  );
}

export function targetOfCurrent(current: CurrentPick): ModelTarget {
  return {
    server: current.server,
    serverLabel: current.server_label,
    model: current.model ?? undefined,
    modelLabel: current.model_label ?? current.model ?? undefined,
  };
}

export function serviceAndModelText(target: ModelTarget): string {
  return target.modelLabel === undefined ||
    target.modelLabel === target.serverLabel
    ? target.serverLabel
    : `${target.serverLabel}, ${target.modelLabel}`;
}

export function oneTimeModelSentence(target: ModelTarget): string {
  return target.modelLabel === undefined
    ? `Use the service ${target.serverLabel}.`
    : `Use the model ${target.modelLabel} of ${target.serverLabel}.`;
}

export const testServiceName = "sample";

export function hasReadyService(options: {
  choices: MediaChoices;
  kind: MediaKind;
}): boolean {
  const choice = choiceOf(options);
  return (choice?.services ?? []).some(
    (service) =>
      service.state === "ready" && service.server !== testServiceName,
  );
}
