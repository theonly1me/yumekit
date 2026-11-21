import { readKeyStates, type MediaServerEntry } from "@yumekit/tools";

export async function wireMediaServerOf(entry: MediaServerEntry) {
  const keys = entry.description?.keys ?? [];
  const states = await readKeyStates({
    variables: keys.map((key) => key.variable),
  });
  return {
    server: entry.server,
    capabilities: entry.capabilities,
    can_check_key: entry.canCheckKey,
    ...(entry.description === undefined
      ? {}
      : {
          label: entry.description.label,
          runs: entry.description.runs,
          models: entry.description.models,
        }),
    ...(entry.descriptionFailure === undefined
      ? {}
      : { description_failure: entry.descriptionFailure }),
    keys: keys.map((key) => ({
      variable: key.variable,
      label: key.label,
      get_key_url: key.get_key_url,
      steps: key.steps,
      source:
        states.find((state) => state.variable === key.variable)?.source ??
        "missing",
    })),
  };
}
