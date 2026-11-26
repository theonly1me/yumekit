import { useEffect } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { useMediaServers } from "../../tools/useMediaServers.js";
import type { MoneyLeft } from "./moneyAction.js";

export function useMoneyLeft(options: {
  client: EngineClient;
  readyTakeId: string | undefined;
}): MoneyLeft | undefined {
  const { state, reload } = useMediaServers(options.client);

  useEffect(() => {
    if (options.readyTakeId === undefined) return;
    reload().catch(() => undefined);
  }, [options.readyTakeId, reload]);

  if (state.kind !== "ready") return undefined;
  const { spending } = state.servers;
  if (spending === undefined || "record_not_valid" in spending) {
    return undefined;
  }
  return { leftUsd: spending.remaining_usd, limitUsd: spending.limit_usd };
}
