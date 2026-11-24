import { contrastRatio } from "@yumekit/scene-kit/schemas";
import { z } from "zod";

const colorInput = (role: string) =>
  z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .describe(`${role}, as a hex color such as #0c0c0d.`);

export const ownColorsInput = z.strictObject({
  background: colorInput("The ground of each scene"),
  text: colorInput("The main text"),
  muted: colorInput("Quiet text, labels, and dimmed lines"),
  accent: colorInput("The one accent color, used rarely"),
});

export type OwnColorsInput = z.infer<typeof ownColorsInput>;

const readableContrast = 4.5;

export function contrastWarningsOf(colors: OwnColorsInput): string[] {
  return (["text", "muted"] as const).flatMap((role) => {
    const ratio = contrastRatio({
      text: colors[role],
      background: colors.background,
    });
    return ratio >= readableContrast
      ? []
      : [
          `The ${role} color has a contrast of ${ratio.toFixed(1)} to 1 on the background, under ${String(readableContrast)} to 1, so it can be hard to read.`,
        ];
  });
}
