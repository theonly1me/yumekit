import type { SheetTry } from "@yumekit/project";

export function sheetNextStepOf(options: {
  castId: string;
  tries: SheetTry[];
}): string {
  const { castId, tries } = options;
  if (tries.at(-1)?.verdict !== "fail") return "The sheet can be used.";
  return `The faults are notes: nothing waits for this verdict. To correct them, call generate_asset with sheet_of "${castId}", the refused picture in reference_asset_ids, and "keep everything of the reference and change only:" each fault. Or use the sheet as it is, with restrictions on its cast entry.`;
}
