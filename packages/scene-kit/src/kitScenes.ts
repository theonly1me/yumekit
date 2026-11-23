import type { SceneModule } from "@yumekit/scene";
import {
  defineKitScene,
  type KitSceneDefinition,
} from "./kit/defineKitScene.js";
import { BarChart } from "./scenes/BarChart.js";
import { BulletList } from "./scenes/BulletList.js";
import { CaptionWords } from "./scenes/CaptionWords.js";
import { ImagePan } from "./scenes/ImagePan.js";
import { Quote } from "./scenes/Quote.js";
import { TitleCard } from "./scenes/TitleCard.js";
import { VideoClip } from "./scenes/VideoClip.js";
import type { StylePack } from "./stylePacks/stylePack.js";
import { calmStylePackOf, stylePackOf } from "./stylePacks/stylePacks.js";

const kitSceneDefinitions: Record<string, KitSceneDefinition> = {
  "title-card": { component: TitleCard, paintsBackground: true },
  "bullet-list": { component: BulletList, paintsBackground: true },
  "image-pan": { component: ImagePan, paintsBackground: true },
  "caption-words": { component: CaptionWords, paintsBackground: false },
  "bar-chart": { component: BarChart, paintsBackground: true },
  quote: { component: Quote, paintsBackground: true },
  "video-clip": { component: VideoClip, paintsBackground: true },
};

function kitScenesFor(stylePack: StylePack): Record<string, SceneModule> {
  return Object.fromEntries(
    Object.entries(kitSceneDefinitions).map(([name, definition]) => [
      name,
      defineKitScene({ stylePack, definition }),
    ]),
  );
}

const kitScenesByPack = new Map<string, Record<string, SceneModule>>();

function knownKitScenesFor(stylePack: StylePack): Record<string, SceneModule> {
  const key = `${stylePack.id}${stylePack.motion.calm === true ? "-calm" : ""}`;
  const known = kitScenesByPack.get(key);
  if (known !== undefined) return known;
  const made = kitScenesFor(stylePack);
  kitScenesByPack.set(key, made);
  return made;
}

export function kitScenesOf(look: string): Record<string, SceneModule> {
  return knownKitScenesFor(stylePackOf(look));
}

export function calmKitScenesOf(look: string): Record<string, SceneModule> {
  return knownKitScenesFor(calmStylePackOf(look));
}

export const kitScenes: Record<string, SceneModule> = kitScenesOf("paper");
