const mostExtraPictures = 4;

export async function settledPicture(
  take: () => Promise<Uint8Array>,
): Promise<Uint8Array> {
  let last = await take();
  for (let extra = 0; extra < mostExtraPictures; extra += 1) {
    const next = await take();
    if (Buffer.from(next).equals(last)) return next;
    last = next;
  }
  return last;
}
