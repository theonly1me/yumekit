import type { Outcome } from "./toolResults.ts";

export function chooseModel<
  Model extends { id: string; isDefault: boolean },
>(options: {
  models: Model[];
  requested: string | undefined;
  kind: string;
}): Outcome<Model, string> {
  const { models, requested } = options;
  const chosen = models.find((model) =>
    requested === undefined ? model.isDefault : model.id === requested,
  );
  if (chosen) return { ok: true, value: chosen };
  const ids = models.map((model) => model.id).join(", ");
  return {
    ok: false,
    failure: `Unknown model "${String(requested)}". The ${options.kind} models of this server are: ${ids}.`,
  };
}
