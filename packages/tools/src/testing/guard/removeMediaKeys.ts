export function removeMediaKeys(options: {
  environment: Record<string, string | undefined>;
  variables: string[];
}): void {
  options.variables.forEach((variable) => {
    Reflect.deleteProperty(options.environment, variable);
  });
}
