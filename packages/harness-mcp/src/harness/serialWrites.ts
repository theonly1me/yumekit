import type { LatestWrites } from "../context.js";

export function createSerialWrites(): LatestWrites {
  let tail: Promise<unknown> = Promise.resolve();
  return (write) => {
    const result = tail.then(write);
    tail = result.catch(() => undefined);
    return result;
  };
}
