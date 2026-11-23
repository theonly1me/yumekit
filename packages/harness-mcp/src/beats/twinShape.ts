import { z } from "zod";
import { twinOfFrameKey, type BeatTwin } from "./beatTwins.js";

function beatInputOf(twin: BeatTwin) {
  return z
    .number()
    .min(twin.isLength ? 0.5 : 0)
    .multipleOf(0.5)
    .optional()
    .describe(
      `${twin.meaning} in beats of the project tempo (set_tempo), in whole or half beats. Beat 0 is frame 0. The harness rounds it to a frame. Give ${twin.frameKey} or ${twin.beatKey}, not both.`,
    );
}

function optionalOf(schema: z.ZodType): z.ZodType {
  return schema instanceof z.ZodOptional ? schema : schema.optional();
}

function described(options: { schema: z.ZodType; from: z.ZodType }): z.ZodType {
  const { description } = options.from;
  return description === undefined
    ? options.schema
    : options.schema.describe(description);
}

function twinSchemaOf(core: z.core.$ZodType): z.ZodType | undefined {
  if (!(core instanceof z.ZodType)) return undefined;
  const schema = core;
  if (schema instanceof z.ZodOptional) {
    const inner = twinSchemaOf(schema.unwrap());
    return inner === undefined
      ? undefined
      : described({ schema: inner.optional(), from: schema });
  }
  if (schema instanceof z.ZodArray) {
    const element = twinSchemaOf(schema.element);
    return element === undefined
      ? undefined
      : described({ schema: z.array(element), from: schema });
  }
  if (schema instanceof z.ZodObject) {
    const changes = twinChangesOf(schema.shape);
    return changes === undefined ? undefined : schema.extend(changes);
  }
  if (
    schema instanceof z.ZodUnion ||
    schema instanceof z.ZodDiscriminatedUnion
  ) {
    const twins = schema.options.map((option) => twinSchemaOf(option));
    if (twins.every((twin) => twin === undefined)) return undefined;
    const options = schema.options.flatMap((...[option, index]) => {
      const chosen = twins[index] ?? option;
      return chosen instanceof z.ZodType ? [chosen] : [];
    });
    return described({ schema: z.union(options), from: schema });
  }
  return undefined;
}

function twinChangesOf(shape: z.ZodRawShape): z.ZodRawShape | undefined {
  const changes: Record<string, z.ZodType> = {};
  for (const [key, core] of Object.entries(shape)) {
    const twin = twinOfFrameKey(key);
    if (twin !== undefined && core instanceof z.ZodType) {
      const value = core;
      changes[key] = described({
        schema: optionalOf(value),
        from: value,
      }).describe(
        `${value.description ?? ""} Or give ${twin.beatKey} in beats.`.trim(),
      );
      changes[twin.beatKey] = beatInputOf(twin);
      continue;
    }
    const nested = twinSchemaOf(core);
    if (nested !== undefined) changes[key] = nested;
  }
  return Object.keys(changes).length === 0 ? undefined : changes;
}

export function withBeatTwins(shape: z.ZodRawShape): z.ZodRawShape {
  return { ...shape, ...twinChangesOf(shape) };
}
