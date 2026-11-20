export interface Hold {
  released: Promise<void>;
  release: () => void;
}

export interface HoldRegistry {
  add: (hold: Hold) => () => void;
  allReleased: () => Promise<void>;
}

export function createHold(): Hold {
  const { promise, resolve } = Promise.withResolvers<undefined>();
  return {
    released: promise,
    release: () => {
      resolve(undefined);
    },
  };
}

export function createHoldRegistry(): HoldRegistry {
  const activeHolds = new Set<Hold>();
  return {
    add: (hold) => {
      activeHolds.add(hold);
      return () => {
        activeHolds.delete(hold);
      };
    },
    allReleased: async () => {
      await Promise.all([...activeHolds].map((hold) => hold.released));
    },
  };
}
