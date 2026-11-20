export function createSerialQueue(): <Value>(
  task: () => Promise<Value>,
) => Promise<Value> {
  let tail: Promise<void> = Promise.resolve();
  return (task) => {
    const result = tail.then(task);
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}
