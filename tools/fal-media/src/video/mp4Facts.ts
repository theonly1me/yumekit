export interface Mp4Facts {
  durationSeconds?: number;
  widthPixels?: number;
  heightPixels?: number;
}

interface Box {
  type: string;
  contentStart: number;
  end: number;
}

const boxHeaderBytes = 8;
const tkhdSizeOffsetByVersion = { 0: 76, 1: 88 } as const;

function boxesIn(options: {
  bytes: Buffer;
  start: number;
  end: number;
}): Box[] {
  const boxes: Box[] = [];
  let offset = options.start;
  while (offset + boxHeaderBytes <= options.end) {
    const declaredSize = options.bytes.readUInt32BE(offset);
    const type = options.bytes.toString("latin1", offset + 4, offset + 8);
    let contentStart = offset + boxHeaderBytes;
    let size = declaredSize;
    if (declaredSize === 1) {
      if (offset + 16 > options.end) break;
      size = Number(options.bytes.readBigUInt64BE(offset + 8));
      contentStart = offset + 16;
    } else if (declaredSize === 0) {
      size = options.end - offset;
    }
    if (size < contentStart - offset || offset + size > options.end) break;
    boxes.push({ type, contentStart, end: offset + size });
    offset += size;
  }
  return boxes;
}

function childrenOf(options: { bytes: Buffer; box: Box }): Box[] {
  return boxesIn({
    bytes: options.bytes,
    start: options.box.contentStart,
    end: options.box.end,
  });
}

function durationOf(options: { bytes: Buffer; mvhd: Box }): number | undefined {
  const { bytes, mvhd } = options;
  const version = bytes.readUInt8(mvhd.contentStart);
  const timescaleOffset = mvhd.contentStart + (version === 1 ? 20 : 12);
  const durationEnd = timescaleOffset + (version === 1 ? 12 : 8);
  if (durationEnd > mvhd.end) return undefined;
  const timescale = bytes.readUInt32BE(timescaleOffset);
  const duration =
    version === 1
      ? Number(bytes.readBigUInt64BE(timescaleOffset + 4))
      : bytes.readUInt32BE(timescaleOffset + 4);
  if (timescale === 0) return undefined;
  return Math.round((duration / timescale) * 1000) / 1000;
}

function sizeOf(options: {
  bytes: Buffer;
  tkhd: Box;
}): { width: number; height: number } | undefined {
  const { bytes, tkhd } = options;
  const version = bytes.readUInt8(tkhd.contentStart);
  if (version !== 0 && version !== 1) return undefined;
  const sizeOffset = tkhd.contentStart + tkhdSizeOffsetByVersion[version];
  if (sizeOffset + 8 > tkhd.end) return undefined;
  const width = Math.round(bytes.readUInt32BE(sizeOffset) / 65536);
  const height = Math.round(bytes.readUInt32BE(sizeOffset + 4) / 65536);
  return width > 0 && height > 0 ? { width, height } : undefined;
}

export function readMp4Facts(bytes: Buffer): Mp4Facts {
  const moov = boxesIn({ bytes, start: 0, end: bytes.length }).find(
    (box) => box.type === "moov",
  );
  if (moov === undefined) return {};
  const children = childrenOf({ bytes, box: moov });
  const mvhd = children.find((box) => box.type === "mvhd");
  const durationSeconds =
    mvhd === undefined ? undefined : durationOf({ bytes, mvhd });
  const size = children
    .filter((box) => box.type === "trak")
    .flatMap((trak) => childrenOf({ bytes, box: trak }))
    .filter((box) => box.type === "tkhd")
    .map((tkhd) => sizeOf({ bytes, tkhd }))
    .find((found) => found !== undefined);
  return {
    ...(durationSeconds === undefined ? {} : { durationSeconds }),
    ...(size === undefined
      ? {}
      : { widthPixels: size.width, heightPixels: size.height }),
  };
}
