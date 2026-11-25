export interface TimedFault {
  fault: string;
  from_seconds: number;
  to_seconds: number;
}

export interface CleanRange {
  from: number;
  to: number;
}

function rounded(seconds: number): string {
  return String(Math.round(seconds * 100) / 100);
}

export function faultTextOf(fault: TimedFault): string {
  return `${fault.fault} (${rounded(fault.from_seconds)}s to ${rounded(fault.to_seconds)}s)`;
}

export function rangeText(range: CleanRange): string {
  return `${rounded(range.from)}s to ${rounded(range.to)}s`;
}

export function cleanRangeOf(options: {
  faults: TimedFault[];
  lengthSeconds: number;
}): CleanRange {
  const sorted = [...options.faults].sort(
    (...[first, second]) => first.from_seconds - second.from_seconds,
  );
  let best: CleanRange = { from: 0, to: 0 };
  let cursor = 0;
  const consider = (to: number) => {
    if (to - cursor > best.to - best.from) best = { from: cursor, to };
  };
  for (const fault of sorted) {
    consider(Math.min(fault.from_seconds, options.lengthSeconds));
    cursor = Math.max(cursor, fault.to_seconds);
  }
  consider(options.lengthSeconds);
  return best;
}
