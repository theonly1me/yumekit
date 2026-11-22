import { z } from "zod";

const contentPart = z.object({
  type: z.string(),
  mime_type: z.string().optional(),
  data: z.string().optional(),
  uri: z.string().optional(),
});

const modalityTokens = z.object({
  modality: z.string(),
  tokens: z.number(),
});

export const interactionSchema = z.object({
  id: z.string().min(1),
  status: z.string(),
  steps: z
    .array(
      z.object({
        type: z.string(),
        content: z.array(contentPart).optional(),
      }),
    )
    .optional(),
  usage: z
    .object({ output_tokens_by_modality: z.array(modalityTokens).optional() })
    .optional(),
});

export type Interaction = z.infer<typeof interactionSchema>;

export type OutputPartType = "image" | "audio" | "video";

export type OutputPart =
  | { kind: "data"; bytes: Buffer; mimeType: string }
  | { kind: "uri"; uri: string; mimeType: string };

export function outputPartOf(options: {
  interaction: Interaction;
  type: OutputPartType;
  defaultMimeType: string;
}): OutputPart | undefined {
  const parts = (options.interaction.steps ?? [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((part) => part.type === options.type);
  const part = parts.at(-1);
  if (!part) return undefined;
  const mimeType = part.mime_type ?? options.defaultMimeType;
  if (part.data !== undefined && part.data !== "") {
    return { kind: "data", bytes: Buffer.from(part.data, "base64"), mimeType };
  }
  if (part.uri !== undefined && part.uri !== "") {
    return { kind: "uri", uri: part.uri, mimeType };
  }
  return undefined;
}

export function outputTokensOf(options: {
  interaction: Interaction;
  modality: OutputPartType;
}): number | undefined {
  return options.interaction.usage?.output_tokens_by_modality?.find(
    (entry) => entry.modality === options.modality,
  )?.tokens;
}

const extensionsByMimeType: Partial<Record<string, string>> = {
  "video/quicktime": "mov",
  "image/jpeg": "jpg",
  "audio/mpeg": "mp3",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
};

export function fileExtensionOf(options: {
  mimeType: string;
  fallback: string;
}): string {
  const mimeType = options.mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  const subtype = mimeType.split("/")[1] ?? "";
  const known = extensionsByMimeType[mimeType];
  if (known !== undefined) return known;
  if (/^[a-z0-9]+$/.test(subtype)) return subtype;
  return options.fallback;
}
