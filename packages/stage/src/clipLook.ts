import { easings } from "@yumekit/scene";
import type { TransitionKind } from "@yumekit/project";
import type { ClipPart } from "./visibleClips.js";

export interface ClipLook {
  transform: string;
  opacity: string;
  clipPath: string;
}

const wholeLook: ClipLook = {
  transform: "",
  opacity: "",
  clipPath: "",
};

const transitionEasing = easings.cubicBezier({
  x1: 0.65,
  y1: 0,
  x2: 0.35,
  y2: 1,
});

function pixels(value: number): string {
  return `${String(value)}px`;
}

function percent(share: number): string {
  return `${String(share * 100)}%`;
}

interface LookInput {
  transition: TransitionKind;
  eased: number;
  widthPixels: number;
}

function slideShiftOf(options: LookInput): number {
  return Math.round(options.eased * options.widthPixels);
}

function leavingLook(options: LookInput): ClipLook {
  const { transition, eased } = options;
  switch (transition) {
    case "slide":
      return {
        ...wholeLook,
        transform: `translateX(${pixels(-slideShiftOf(options))})`,
      };
    case "zoom":
      return { ...wholeLook, transform: `scale(${String(1 + 0.2 * eased)})` };
    case "fade":
    case "wipe":
      return wholeLook;
  }
}

function enteringLook(options: LookInput): ClipLook {
  const { transition, eased, widthPixels } = options;
  switch (transition) {
    case "fade":
      return { ...wholeLook, opacity: String(eased) };
    case "slide":
      return {
        ...wholeLook,
        transform: `translateX(${pixels(Math.max(0, widthPixels - slideShiftOf(options) - 1))})`,
      };
    case "wipe":
      return { ...wholeLook, clipPath: `inset(0 0 0 ${percent(1 - eased)})` };
    case "zoom":
      return {
        ...wholeLook,
        opacity: String(eased),
        transform: `scale(${String(0.9 + 0.1 * eased)})`,
      };
  }
}

export function clipLookOf(options: {
  part: ClipPart;
  widthPixels: number;
}): ClipLook {
  const { part, widthPixels } = options;
  if (part.kind === "whole") return wholeLook;
  const input = {
    transition: part.transition,
    eased: transitionEasing(part.progress),
    widthPixels,
  };
  return part.kind === "leaving" ? leavingLook(input) : enteringLook(input);
}

export function applyClipLook(options: {
  box: HTMLElement;
  look: ClipLook;
}): void {
  const { style } = options.box;
  style.transform = options.look.transform;
  style.opacity = options.look.opacity;
  style.clipPath = options.look.clipPath;
}
