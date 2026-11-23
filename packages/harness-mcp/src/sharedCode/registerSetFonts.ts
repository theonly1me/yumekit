import { fontStyles } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult } from "../results.js";

const fontWeight = z.int().min(1).max(1000);

const fontInput = z.strictObject({
  asset_id: idInput("A font asset from import_asset."),
  family: z
    .string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9 -]{0,63}$/)
    .describe(
      "The family name that scene code uses in fontFamily, for example 'Display'. 1 to 64 letters, digits, spaces, or hyphens.",
    ),
  weight: z
    .union([fontWeight, z.tuple([fontWeight, fontWeight])])
    .optional()
    .describe(
      "The weight of this file, for example 700, or the range of a variable font, for example [100, 900]. Default 400.",
    ),
  style: z
    .enum(fontStyles)
    .optional()
    .describe("normal or italic. Default normal."),
});

export function registerSetFonts(context: HarnessContext): void {
  context.tools.add({
    name: "set_fonts",
    description:
      "Load font assets for the whole video, in the preview and in the render, before the first frame. A custom scene then uses a font by its family name in fontFamily, with no font code of its own. Import each font file first with import_asset (kind font). Give each file of a family with its weight, for example a regular and a bold file. The list replaces the fonts of the project; an empty list removes them. The look keeps its own fonts for the kit scenes.",
    inputSchema: {
      fonts: z.array(fontInput).max(8).describe("0 to 8 font files."),
    },
    run: ({ input }) => {
      const snapshot = context.store.read();
      const notFont = input.fonts.find(
        (font) =>
          snapshot.assets.find((asset) => asset.id === font.asset_id)?.kind !==
          "font",
      );
      if (notFont !== undefined) {
        return failureResult({
          kind: "font-asset-not-found",
          message: `The asset "${notFont.asset_id}" is not a font asset of the project.`,
          hint: "Import the font file with import_asset (kind font), or call list_assets with kind font for the font assets.",
        });
      }
      const fonts = input.fonts.map((font) => ({
        assetId: font.asset_id,
        family: font.family,
        ...(font.weight === undefined ? {} : { weight: font.weight }),
        ...(font.style === undefined ? {} : { style: font.style }),
      }));
      return applyEditsResult({
        store: context.store,
        edits: [{ kind: "setFonts", fonts }],
        line:
          fonts.length === 0
            ? "The project has no fonts of its own now."
            : `Fonts for the whole video: ${[...new Set(fonts.map((font) => font.family))].join(", ")}.`,
        data: { families: [...new Set(fonts.map((font) => font.family))] },
      });
    },
  });
}
