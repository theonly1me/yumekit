import type { Capability, Outcome } from "../types.js";
import {
  ledgerFileOf,
  readLedger,
  writeLedger,
  type CostBasis,
  type LedgerEntry,
  type SpendingRecordNotValid,
} from "./ledger.js";

export interface SpendingSummary {
  limitUsd: number;
  spentUsd: number;
  remainingUsd: number;
  paidCalls: number;
}

export interface SpendingLimitReached {
  kind: "spending-limit-reached";
  server: string;
  limitUsd: number;
  spentUsd: number;
  priceUsd: number;
  priceBasis: Exclude<CostBasis, "reported">;
}

export interface PaidCall {
  server: string;
  model?: string;
  capability: Capability;
  fileStem: string;
  usd: number;
  basis: Exclude<CostBasis, "reported">;
}

export interface Reservation {
  settle: (cost: {
    usd: number;
    basis: CostBasis;
    timedOut?: boolean;
  }) => Promise<void>;
  release: () => void;
}

export interface SpendingBook {
  reserve: (
    call: PaidCall,
  ) => Promise<
    Outcome<Reservation, SpendingLimitReached | SpendingRecordNotValid>
  >;
  summary: () => Promise<Outcome<SpendingSummary, SpendingRecordNotValid>>;
  heldUsd: () => number;
}

export function roundedUsd(usd: number): number {
  return Math.round(usd * 10_000) / 10_000;
}

function totalOf(entries: LedgerEntry[]): number {
  return entries.reduce((...[total, entry]) => total + entry.usd, 0);
}

export function createSpendingBook(options: {
  projectFolder: string;
  limitUsd: () => Promise<number>;
}): SpendingBook {
  const file = ledgerFileOf(options.projectFolder);
  const reserved = new Set<{ usd: number }>();
  let writes: Promise<unknown> = Promise.resolve();
  const reservedUsd = () =>
    [...reserved].reduce((...[total, held]) => total + held.usd, 0);

  const append = (entry: LedgerEntry) => {
    const written = writes.then(async () => {
      const entries = await readLedger(file);
      if (!entries.ok) return;
      await writeLedger({ file, entries: [...entries.value, entry] });
    });
    writes = written.catch(() => undefined);
    return written;
  };

  return {
    reserve: async (call) => {
      await writes;
      const entries = await readLedger(file);
      if (!entries.ok) return entries;
      const spentUsd = totalOf(entries.value);
      const limitUsd = await options.limitUsd();
      if (roundedUsd(spentUsd + reservedUsd() + call.usd) > limitUsd) {
        return {
          ok: false,
          failure: {
            kind: "spending-limit-reached",
            server: call.server,
            limitUsd,
            spentUsd: roundedUsd(spentUsd + reservedUsd()),
            priceUsd: roundedUsd(call.usd),
            priceBasis: call.basis,
          },
        };
      }
      const held = { usd: call.usd };
      reserved.add(held);
      return {
        ok: true,
        value: {
          release: () => {
            reserved.delete(held);
          },
          settle: async (cost) => {
            await append({
              at: new Date().toISOString(),
              server: call.server,
              ...(call.model === undefined ? {} : { model: call.model }),
              capability: call.capability,
              file_stem: call.fileStem,
              usd: roundedUsd(cost.usd),
              basis: cost.basis,
              ...(cost.timedOut === true ? { timed_out: true } : {}),
            }).finally(() => reserved.delete(held));
          },
        },
      };
    },
    summary: async () => {
      await writes;
      const entries = await readLedger(file);
      if (!entries.ok) return entries;
      const limitUsd = await options.limitUsd();
      const spentUsd = roundedUsd(totalOf(entries.value));
      return {
        ok: true,
        value: {
          limitUsd,
          spentUsd,
          remainingUsd: roundedUsd(Math.max(0, limitUsd - spentUsd)),
          paidCalls: entries.value.length,
        },
      };
    },
    heldUsd: reservedUsd,
  };
}
