export type Outcome<Value, Failure> =
  { ok: true; value: Value } | { ok: false; failure: Failure };

export function succeed<Value>(value: Value): { ok: true; value: Value } {
  return { ok: true, value };
}

export function fail<Failure>(failure: Failure): {
  ok: false;
  failure: Failure;
} {
  return { ok: false, failure };
}
