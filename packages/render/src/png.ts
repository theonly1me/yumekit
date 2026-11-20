const widthOffset = 16;
const heightOffset = 20;

export function pngSizeOf(png: Uint8Array): {
  widthPixels: number;
  heightPixels: number;
} {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return {
    widthPixels: view.getUint32(widthOffset),
    heightPixels: view.getUint32(heightOffset),
  };
}
