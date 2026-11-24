export function percentOf(options: { total: number; count: number }): number {
  return options.count === 0 ? 0 : (options.total / options.count / 255) * 100;
}
