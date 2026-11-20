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

export type VideoOutput =
  | { kind: "data"; bytes: Buffer; mimeType: string }
  | { kind: "uri"; uri: string; mimeType: string };

const defaultMimeType = "video/mp4";

export function videoOutputOf(
  interaction: Interaction,
): VideoOutput | undefined {
  const parts = (interaction.steps ?? [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((part) => part.type === "video");
  const part = parts.at(-1);
  if (!part) return undefined;
  const mimeType = part.mime_type ?? defaultMimeType;
  if (part.data !== undefined && part.data !== "") {
    return { kind: "data", bytes: Buffer.from(part.data, "base64"), mimeType };
  }
  if (part.uri !== undefined && part.uri !== "") {
    return { kind: "uri", uri: part.uri, mimeType };
  }
  return undefined;
}

export function videoTokensOf(interaction: Interaction): number | undefined {
  return interaction.usage?.output_tokens_by_modality?.find(
    (entry) => entry.modality === "video",
  )?.tokens;
}

export function fileExtensionOf(mimeType: string): string {
  const subtype = mimeType.split("/")[1]?.split(";")[0]?.trim() ?? "";
  if (subtype === "quicktime") return "mov";
  if (/^[a-z0-9]+$/.test(subtype)) return subtype;
  return "mp4";
}
