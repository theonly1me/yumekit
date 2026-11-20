const fnvOffsetBasis = 0x811c9dc5;
const fnvPrime = 0x01000193;
const mulberryIncrement = 0x6d2b79f5;
const twoToThe32 = 4294967296;

function hashSeed(seed: string): number {
  let hash = fnvOffsetBasis;
  for (const character of seed) {
    const codePoint = character.codePointAt(0) ?? 0;
    hash = Math.imul(hash ^ codePoint, fnvPrime) >>> 0;
  }
  return hash;
}

export function seededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state = (state + mulberryIncrement) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / twoToThe32;
  };
}
