import { planBudgetOf } from "@yumekit/project/plan-budget";
import type { Snapshot } from "../../engine/snapshot.js";
import type { EngineClient } from "../../engine/engineClient.js";
import { useMediaServers } from "../../tools/useMediaServers.js";

export function BudgetLines(props: {
  client: EngineClient;
  snapshot: Snapshot;
}) {
  const { state } = useMediaServers(props.client);
  const plan = props.snapshot.bible.storyPlan;
  if (plan === undefined || state.kind !== "ready") return null;
  const { spending } = state.servers;
  const limitUsd =
    spending === undefined || "record_not_valid" in spending
      ? undefined
      : spending.limit_usd;
  const budget = planBudgetOf({
    shots: plan.shots,
    estimateUsd: limitUsd === undefined ? undefined : plan.costEstimateUsd,
    limitSeconds: state.servers.generated_video.limit_seconds,
    limitUsd: limitUsd ?? 0,
  });
  if (budget.warnings.length === 0) return null;
  return (
    <ul
      className="shot-faults budget-warnings"
      aria-label="Limits the plan passes"
    >
      {budget.warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
  );
}
