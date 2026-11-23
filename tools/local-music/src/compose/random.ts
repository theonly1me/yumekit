function mixBits(value: number): number {
  let mixed = value >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x85ebca6b);
  mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35);
  return (mixed ^ (mixed >>> 16)) >>> 0;
}

function hashText(text: string): number {
  let hash = 0x811c9dc5;
  for (const character of text) {
    hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 0x01000193);
  }
  return hash >>> 0;
}

export function chanceOf(options: {
  seed: number;
  key: string;
  index?: number;
}): number {
  const mixed = mixBits(
    mixBits(hashText(options.key) ^ mixBits(options.seed)) +
      Math.imul(options.index ?? 0, 0x9e3779b9),
  );
  return mixed / 4294967296;
}

export function pickOf<Item>(options: {
  seed: number;
  key: string;
  index?: number;
  items: readonly Item[];
}): Item {
  const index = Math.floor(chanceOf(options) * options.items.length);
  const item = options.items[index];
  if (item === undefined) throw new Error("pickOf needs at least one item");
  return item;
}

export function noiseAt(sampleIndex: number): number {
  return (
    mixBits(Math.imul(sampleIndex, 0x27d4eb2d) ^ 0x165667b1) / 2147483648 - 1
  );
}

export function seedOfText(text: string): number {
  return hashText(text) % 1_000_000;
}
