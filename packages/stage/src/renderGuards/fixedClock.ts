import { replaceProperty } from "./replaceProperty.js";

export const fixedEpochMilliseconds = Date.UTC(2000, 0, 1);

const SystemDate = Date;

type DateParts = [
  year: number,
  monthIndex: number,
  date?: number,
  hours?: number,
  minutes?: number,
  seconds?: number,
  milliseconds?: number,
];

class FixedDate extends SystemDate {
  constructor(...values: [] | [value: string | number | Date] | DateParts) {
    if (values.length === 0) {
      super(fixedEpochMilliseconds);
    } else if (values.length === 1) {
      super(values[0]);
    } else {
      super(...values);
    }
  }

  static override now(): number {
    return fixedEpochMilliseconds;
  }
}

export function fixClock(): () => void {
  const restoreDate = replaceProperty({
    target: globalThis,
    key: "Date",
    value: FixedDate,
  });
  const restoreNow = replaceProperty({
    target: performance,
    key: "now",
    value: () => 0,
  });
  return () => {
    restoreNow();
    restoreDate();
  };
}
