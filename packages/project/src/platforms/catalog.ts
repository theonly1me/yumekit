export const platformIds = [
  "youtube",
  "youtube-shorts",
  "tiktok",
  "instagram-reel",
  "instagram-post",
  "x",
  "linkedin",
  "square",
] as const;

export type PlatformId = (typeof platformIds)[number];

export interface Platform {
  id: PlatformId;
  name: string;
  shape: string;
  widthPixels: number;
  heightPixels: number;
  outputId: string;
  outputLabel: string;
}

const wide = {
  shape: "16:9",
  widthPixels: 1920,
  heightPixels: 1080,
  outputId: "wide",
  outputLabel: "Wide 16:9",
};

const tall = {
  shape: "9:16",
  widthPixels: 1080,
  heightPixels: 1920,
  outputId: "tall",
  outputLabel: "Tall 9:16",
};

const platformsById: Record<PlatformId, Omit<Platform, "id">> = {
  youtube: { name: "YouTube", ...wide },
  "youtube-shorts": { name: "YouTube Shorts", ...tall },
  tiktok: { name: "TikTok", ...tall },
  "instagram-reel": { name: "Instagram Reel", ...tall },
  "instagram-post": {
    name: "Instagram post",
    shape: "4:5",
    widthPixels: 1080,
    heightPixels: 1350,
    outputId: "portrait",
    outputLabel: "Portrait 4:5",
  },
  x: { name: "X", ...wide },
  linkedin: { name: "LinkedIn", ...wide },
  square: {
    name: "Square",
    shape: "1:1",
    widthPixels: 1080,
    heightPixels: 1080,
    outputId: "square",
    outputLabel: "Square 1:1",
  },
};

export function platformOf(id: PlatformId): Platform {
  return { id, ...platformsById[id] };
}

export const platformCatalog: readonly Platform[] = platformIds.map(platformOf);

export function isPlatformId(value: string): value is PlatformId {
  return platformIds.some((id) => id === value);
}

export function findPlatform(id: string): Platform | undefined {
  return isPlatformId(id) ? platformOf(id) : undefined;
}

export function platformsOfSize(options: {
  widthPixels: number;
  heightPixels: number;
}): Platform[] {
  return platformCatalog.filter(
    (platform) =>
      platform.widthPixels === options.widthPixels &&
      platform.heightPixels === options.heightPixels,
  );
}

export function inCatalogOrder(ids: readonly PlatformId[]): PlatformId[] {
  return platformIds.filter((id) => ids.includes(id));
}
