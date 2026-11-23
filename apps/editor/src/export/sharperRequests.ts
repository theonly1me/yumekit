import type { ExportRow } from "./exportRows.js";
import type { SharperRequest } from "./sharpenExport.js";

export function sharperRequestsOf(rows: ExportRow[]): SharperRequest[] {
  const byOutput = new Map<string, ExportRow[]>();
  for (const row of rows) {
    byOutput.set(row.output.id, [...(byOutput.get(row.output.id) ?? []), row]);
  }
  return [...byOutput.entries()].map(([outputId, ofOutput]) => {
    const platformIds = ofOutput.flatMap((row) =>
      row.platformId === undefined ? [] : [row.platformId],
    );
    return {
      outputId,
      platformIds: platformIds.length === 0 ? undefined : platformIds,
    };
  });
}
