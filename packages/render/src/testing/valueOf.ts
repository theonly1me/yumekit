import type { Outcome, RenderFailure } from "../index.js";

export function failureOf<Value>(
  outcome: Outcome<Value, RenderFailure>,
): RenderFailure {
  if (outcome.ok) {
    throw new Error("The render succeeded, but the test expects a failure");
  }
  return outcome.failure;
}

export function valueOf<Value>(outcome: Outcome<Value, RenderFailure>): Value {
  if (!outcome.ok) {
    throw new Error(JSON.stringify(outcome.failure, null, 2));
  }
  return outcome.value;
}
