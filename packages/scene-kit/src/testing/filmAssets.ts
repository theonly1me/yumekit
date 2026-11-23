import type { SceneAsset } from "@yumekit/scene";

export function testVideo(options: {
  name: string;
  widthPixels: number;
  heightPixels: number;
  marks?: SceneAsset["marks"];
}): SceneAsset {
  return {
    url: `/${options.name}.mp4`,
    kind: "video",
    widthPixels: options.widthPixels,
    heightPixels: options.heightPixels,
    durationFrames: 300,
    framePictures: {
      urlPrefix: `/test-frame-pictures/${options.name}-`,
      count: 300,
    },
    ...(options.marks === undefined ? {} : { marks: options.marks }),
  };
}

export function pictureFramesOf(element: HTMLElement): string[] {
  return [...element.querySelectorAll("img")].map(
    (image) => /-(\d+)\.jpg$/.exec(image.getAttribute("src") ?? "")?.[1] ?? "",
  );
}
