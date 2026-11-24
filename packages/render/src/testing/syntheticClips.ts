import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

const runFile = promisify(execFile);

const encode = ["-r", "24", "-pix_fmt", "yuv420p", "-c:v", "libx264"];

export async function detailedPicture(folder: string): Promise<string> {
  const file = join(folder, "picture.png");
  await runFile("ffmpeg", [
    ...["-v", "error", "-y", "-f", "lavfi", "-i", "mandelbrot=s=480x180"],
    ...["-frames:v", "1", file],
  ]);
  return file;
}

export async function firstPictureOfTheClips(folder: string): Promise<string> {
  const picture = await detailedPicture(folder);
  const file = join(folder, "start.png");
  await runFile("ffmpeg", [
    ...["-v", "error", "-y", "-i", picture, "-vf", "crop=320:180:0:0", file],
  ]);
  return file;
}

export const startPictureFilters = {
  another: "crop=320:180:160:0,negate",
  redrawn: "crop=320:180:10:4,gblur=sigma=2,eq=contrast=1.15",
} as const;

export async function changedPicture(options: {
  folder: string;
  change: keyof typeof startPictureFilters;
}): Promise<string> {
  const picture = await detailedPicture(options.folder);
  const file = join(options.folder, `${options.change}.png`);
  await runFile("ffmpeg", [
    ...["-v", "error", "-y", "-i", picture],
    ...["-vf", startPictureFilters[options.change], file],
  ]);
  return file;
}

export async function clipOf(options: {
  folder: string;
  name: string;
  filter: string;
  secondInput?: string[];
}): Promise<string> {
  const picture = await detailedPicture(options.folder);
  const file = join(options.folder, `${options.name}.mp4`);
  await runFile("ffmpeg", [
    ...["-v", "error", "-y", "-loop", "1", "-t", "3", "-i", picture],
    ...(options.secondInput ?? []),
    ...["-filter_complex", options.filter, "-t", "3", ...encode, file],
  ]);
  return file;
}

export const clipFilters = {
  still: "[0]crop=320:180:0:0",
  panOfAStill: "[0]crop=320:180:'t*20':0",
  squareInTheTopLeft:
    "[0]crop=320:180:0:0[picture];[picture][1]overlay=x='10+t*20':y=20",
  cutInTheMiddle:
    "[0]crop=320:180:0:0,split[first][second];[first]trim=duration=1.5[before];[second]trim=start=1.5,setpts=PTS-STARTPTS,negate[after];[before][after]concat=n=2",
} as const;

export const whiteSquareInput = [
  ...["-f", "lavfi", "-i", "color=white:s=24x24:d=3"],
];
