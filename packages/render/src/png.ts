const widthOffset = 16;
const heightOffset = 20;

export interface PictureSize {
  widthPixels: number;
  heightPixels: number;
}

export function evenSizeOf(size: PictureSize): PictureSize {
  return {
    widthPixels: size.widthPixels - (size.widthPixels % 2),
    heightPixels: size.heightPixels - (size.heightPixels % 2),
  };
}

export function pngSizeOf(png: Uint8Array): PictureSize {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return {
    widthPixels: view.getUint32(widthOffset),
    heightPixels: view.getUint32(heightOffset),
  };
}
