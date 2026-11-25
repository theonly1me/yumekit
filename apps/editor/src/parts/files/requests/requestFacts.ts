import type { MediaRequest } from "./requestSchema.js";

const kindWords: Record<string, string> = {
  image: "Picture",
  speech: "Voice",
  align: "Word timing",
  music: "Music",
  video: "Video clip",
  "sound-effect": "Sound",
  "talking-clip": "Talking clip",
  sharper: "Sharper copy",
};

const pictureRoleWords: Record<string, string> = {
  "first-frame": "Start picture",
  "last-frame": "End picture",
  reference: "Reference",
  media: "Source",
};

const timeFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function kindWordOf(request: MediaRequest): string {
  return kindWords[request.capability] ?? request.capability;
}

export function pictureRoleOf(role: string): string {
  return pictureRoleWords[role] ?? role;
}

export function timeOf(request: MediaRequest): string {
  const at = new Date(request.at);
  return Number.isNaN(at.getTime()) ? request.at : timeFormat.format(at);
}

export function costOf(request: MediaRequest): string {
  if (request.usd === undefined) {
    return request.failure === undefined ? "Free" : "Not charged";
  }
  const amount = `$${request.usd.toFixed(2)}`;
  return request.basis === "reported" ? amount : `About ${amount}`;
}

export function lengthOf(request: MediaRequest): string | undefined {
  return request.seconds < 0.1
    ? undefined
    : `Took ${request.seconds.toFixed(1)} s`;
}

function settingWordsOf(options: {
  name: string;
  value: string | number | boolean;
}): string {
  const { name, value } = options;
  if (name === "duration_seconds") return `${String(value)} seconds`;
  if (name === "with_audio") return value === true ? "With sound" : "No sound";
  return `${name.split("_").join(" ")} ${String(value)}`;
}

export function settingsOf(request: MediaRequest): string[] {
  const {
    width_pixels: width,
    height_pixels: height,
    ...rest
  } = request.settings;
  const size =
    width === undefined || height === undefined
      ? []
      : [`${String(width)} by ${String(height)}`];
  return [
    ...size,
    ...Object.entries(rest).map(([name, value]) =>
      settingWordsOf({ name, value }),
    ),
  ];
}

export function fileNameOf(file: string): string {
  return file.split("/").at(-1) ?? file;
}
