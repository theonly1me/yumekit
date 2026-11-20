export interface Mp4Facts {
  widthPixels?: number;
  heightPixels?: number;
  durationSeconds?: number;
}

interface Box {
  type: string;
  payload: Buffer;
}

const tkhdSizeOffsetByVersion = { 0: 76, 1: 88 } as const;

function boxSize(options: { bytes: Buffer; offset: number }): {
  size: number;
  headerSize: number;
} {
  const { bytes, offset } = options;
  const size = bytes.readUInt32BE(offset);
  if (size === 1 && offset + 16 <= bytes.length) {
    return { size: Number(bytes.readBigUInt64BE(offset + 8)), headerSize: 16 };
  }
  if (size === 0) return { size: bytes.length - offset, headerSize: 8 };
  return { size, headerSize: 8 };
}

function childBoxes(bytes: Buffer): Box[] {
  const boxes: Box[] = [];
  let offset = 0;
  while (offset + 8 <= bytes.length) {
    const { size, headerSize } = boxSize({ bytes, offset });
    if (size < headerSize || offset + size > bytes.length) break;
    boxes.push({
      type: bytes.toString("latin1", offset + 4, offset + 8),
      payload: bytes.subarray(offset + headerSize, offset + size),
    });
    offset += size;
  }
  return boxes;
}

function durationSecondsOf(mvhd: Buffer): number | undefined {
  const version = mvhd.readUInt8(0);
  if (version === 0 && mvhd.length >= 20) {
    const timescale = mvhd.readUInt32BE(12);
    return timescale > 0 ? mvhd.readUInt32BE(16) / timescale : undefined;
  }
  if (version === 1 && mvhd.length >= 32) {
    const timescale = mvhd.readUInt32BE(20);
    const duration = Number(mvhd.readBigUInt64BE(24));
    return timescale > 0 ? duration / timescale : undefined;
  }
  return undefined;
}

function sizeOf(tkhd: Buffer): { width: number; height: number } | undefined {
  const version = tkhd.readUInt8(0);
  if (version !== 0 && version !== 1) return undefined;
  const offset = tkhdSizeOffsetByVersion[version];
  if (tkhd.length < offset + 8) return undefined;
  const width = Math.round(tkhd.readUInt32BE(offset) / 65536);
  const height = Math.round(tkhd.readUInt32BE(offset + 4) / 65536);
  return width > 0 && height > 0 ? { width, height } : undefined;
}

export function readMp4Facts(bytes: Buffer): Mp4Facts {
  const moov = childBoxes(bytes).find((box) => box.type === "moov");
  if (!moov) return {};
  const children = childBoxes(moov.payload);
  const mvhd = children.find((box) => box.type === "mvhd");
  const size = children
    .filter((box) => box.type === "trak")
    .flatMap((trak) => childBoxes(trak.payload))
    .filter((box) => box.type === "tkhd" && box.payload.length > 0)
    .map((tkhd) => sizeOf(tkhd.payload))
    .find((found) => found !== undefined);
  const durationSeconds =
    mvhd && mvhd.payload.length > 0
      ? durationSecondsOf(mvhd.payload)
      : undefined;
  return {
    ...(size ? { widthPixels: size.width, heightPixels: size.height } : {}),
    ...(durationSeconds === undefined ? {} : { durationSeconds }),
  };
}
