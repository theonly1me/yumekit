const layerThreeKilobitsMpegOne = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
];

const layerThreeKilobitsMpegTwo = [
  0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160,
];

const sampleRatesByVersion: Partial<Record<number, number[]>> = {
  3: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  0: [11025, 12000, 8000],
};

interface FrameHeader {
  lengthBytes: number;
  samples: number;
  sampleRate: number;
}

function readFrameHeader(options: {
  bytes: Buffer;
  offset: number;
}): FrameHeader | undefined {
  const { bytes, offset } = options;
  if (offset + 4 > bytes.length) return undefined;
  const header = bytes.readUInt32BE(offset);
  if (header >>> 21 !== 0x7ff) return undefined;
  const version = (header >>> 19) & 0b11;
  const layer = (header >>> 17) & 0b11;
  const bitrateIndex = (header >>> 12) & 0b1111;
  const sampleRateIndex = (header >>> 10) & 0b11;
  const padding = (header >>> 9) & 1;
  const sampleRate = sampleRatesByVersion[version]?.[sampleRateIndex];
  const isMpegOne = version === 3;
  const kilobits = (
    isMpegOne ? layerThreeKilobitsMpegOne : layerThreeKilobitsMpegTwo
  )[bitrateIndex];
  if (layer !== 1 || sampleRate === undefined || !kilobits) return undefined;
  const bytesPerSlot = isMpegOne ? 144 : 72;
  return {
    lengthBytes:
      Math.floor((bytesPerSlot * kilobits * 1000) / sampleRate) + padding,
    samples: isMpegOne ? 1152 : 576,
    sampleRate,
  };
}

function firstFrameOffset(bytes: Buffer): number {
  if (bytes.length < 10 || bytes.toString("latin1", 0, 3) !== "ID3") return 0;
  const tagLength =
    ((bytes.readUInt8(6) & 0x7f) << 21) |
    ((bytes.readUInt8(7) & 0x7f) << 14) |
    ((bytes.readUInt8(8) & 0x7f) << 7) |
    (bytes.readUInt8(9) & 0x7f);
  return 10 + tagLength;
}

export function readMp3DurationSeconds(bytes: Buffer): number | undefined {
  let offset = firstFrameOffset(bytes);
  let seconds = 0;
  let frames = 0;
  for (;;) {
    const frame = readFrameHeader({ bytes, offset });
    if (!frame) break;
    seconds += frame.samples / frame.sampleRate;
    frames += 1;
    offset += frame.lengthBytes;
  }
  return frames === 0 ? undefined : seconds;
}
