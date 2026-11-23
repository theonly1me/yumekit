import type { SceneModule } from "@yumekit/scene";
import {
  defineKitScene,
  type KitSceneDefinition,
} from "./kit/defineKitScene.js";
import { BarChart } from "./scenes/BarChart.js";
import { BulletList } from "./scenes/BulletList.js";
import { CaptionWords } from "./scenes/CaptionWords.js";
import { Chat } from "./scenes/chat/Chat.js";
import { Checklist } from "./scenes/checklist/Checklist.js";
import { Compare } from "./scenes/compare/Compare.js";
import { Device } from "./scenes/device/Device.js";
import { EndCard } from "./scenes/endCard/EndCard.js";
import { Hero } from "./scenes/hero/Hero.js";
import { ImagePan } from "./scenes/ImagePan.js";
import { Kinetic } from "./scenes/kinetic/Kinetic.js";
import { LogoReveal } from "./scenes/logoReveal/LogoReveal.js";
import { LowerThird } from "./scenes/lowerThird/LowerThird.js";
import { Quote } from "./scenes/Quote.js";
import { Split } from "./scenes/split/Split.js";
import { Stat } from "./scenes/stat/Stat.js";
import { Steps } from "./scenes/steps/Steps.js";
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
  hero: { component: Hero, paintsBackground: true },
  stat: { component: Stat, paintsBackground: true },
  compare: { component: Compare, paintsBackground: true },
  steps: { component: Steps, paintsBackground: true },
  chat: { component: Chat, paintsBackground: true },
  device: { component: Device, paintsBackground: true },
  split: { component: Split, paintsBackground: true },
  "logo-reveal": { component: LogoReveal, paintsBackground: true },
  checklist: { component: Checklist, paintsBackground: true },
  "end-card": { component: EndCard, paintsBackground: true },
  "lower-third": { component: LowerThird, paintsBackground: false },
  kinetic: { component: Kinetic, paintsBackground: true },
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
