export function replaceProperty(options: {
  target: object;
  key: PropertyKey;
  value: unknown;
}): () => void {
  const { target, key, value } = options;
  const original = Reflect.getOwnPropertyDescriptor(target, key);
  Reflect.defineProperty(target, key, {
    value,
    configurable: true,
    writable: true,
  });
  return () => {
    if (original === undefined) {
      Reflect.deleteProperty(target, key);
      return;
    }
    Reflect.defineProperty(target, key, original);
  };
}
