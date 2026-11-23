import type { ModelTarget } from "../settings/services/index.js";
import type { ExportRow } from "./exportRows.js";
import type { SharperRequest } from "./sharpenExport.js";

export function sharperRequestsOf(options: {
  rows: ExportRow[];
  target: ModelTarget | undefined;
}): SharperRequest[] {
  const { target } = options;
  if (target === undefined) return [];
  const byOutput = new Map<string, ExportRow[]>();
  for (const row of options.rows) {
    byOutput.set(row.output.id, [...(byOutput.get(row.output.id) ?? []), row]);
  }
  return [...byOutput.entries()].map(([outputId, ofOutput]) => {
    const platformIds = ofOutput.flatMap((row) =>
      row.platformId === undefined ? [] : [row.platformId],
    );
    return {
      outputId,
      platformIds: platformIds.length === 0 ? undefined : platformIds,
      versionName: `the ${ofOutput.map((row) => row.name).join(" and ")} version`,
      server: target.server,
      ...(target.model === undefined ? {} : { model: target.model }),
    };
  });
}
