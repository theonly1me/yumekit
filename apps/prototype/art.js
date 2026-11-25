import * as part from "./artParts.js";
import { cast } from "./film.js";

const wren = cast.wren.looks.harbor;
const wrenSnow = cast.wren.looks.snow;
const odo = cast.odo.looks.base;
const pell = cast.pell.looks.base;
const paper = ["#efe9dc", "#e4dccb"];
let counter = 0;

const scenes = {
  harbor: {
    sky: ["#f2c48d", "#7d8ea3"],
    back: () =>
      part.sun({ x: 118, y: 30, color: "#ffe2b0" }) +
      part.sea({ y: 58, color: "#4c5f73" }) +
      part.tower({ x: 28, y: 60, scale: 0.8 }),
    move: () =>
      part.boat({ x: 98, y: 64, scale: 1.2 }) +
      part.figure({ x: 66, y: 70, look: wren }),
  },
  tower: {
    sky: ["#c9cdd2", "#6f7a86"],
    back: () =>
      part.land({ y: 72, color: "#3b3f3a" }) +
      part.tower({ x: 96, y: 76, scale: 1.8 }),
    move: () =>
      part.figure({ x: 66, y: 82, scale: 1.1, look: odo, pose: "reach" }),
  },
  bell: {
    sky: ["#2b2420", "#5a4632"],
    back: () => part.lantern({ x: 130, y: 24, scale: 1.4 }),
    move: () => part.bell({ x: 78, y: 46, scale: 2.6, cracked: true }),
  },
  deck: {
    sky: ["#d8c8b0", "#8293a3"],
    back: () =>
      part.sea({ y: 52, color: "#3d5266" }) +
      `<rect x="-20" y="68" width="200" height="30" fill="#5b4535"/>`,
    move: () =>
      part.bell({ x: 112, y: 62, scale: 0.9 }) +
      part.figure({ x: 74, y: 84, scale: 1.3, look: wren, pose: "pull" }),
  },
  fog: {
    sky: ["#b9c0c4", "#8d979d"],
    back: () => part.sea({ y: 60, color: "#56646d" }),
    move: () =>
      part.boat({ x: 74, y: 68, scale: 0.8 }) + part.fog({ amount: 0.9 }),
  },
  fogvoice: {
    sky: ["#a9b1b6", "#7d878d"],
    back: () =>
      part.sea({ y: 60, color: "#4d5a62" }) +
      part.lantern({ x: 118, y: 54, scale: 0.9 }),
    move: () =>
      part.figure({ x: 56, y: 76, scale: 1.2, look: wren, pose: "wave" }) +
      part.fog({ amount: 0.7 }),
  },
  drift: {
    sky: ["#b4bcc1", "#87929a"],
    back: () => part.sea({ y: 58, color: "#4f5d66" }),
    move: () =>
      part.figure({ x: 88, y: 64, look: pell, pose: "wave" }) +
      part.boat({ x: 90, y: 66, scale: 1.1, color: "#6a5643" }) +
      part.fog({ amount: 0.45 }),
  },
  snowshore: {
    sky: ["#dfe6ec", "#9fb0bf"],
    back: () =>
      part.sea({ y: 56, color: "#5d7282" }) +
      part.land({ y: 66, color: "#eef2f5" }),
    move: () =>
      part.figure({ x: 70, y: 76, look: wrenSnow }) +
      part.figure({ x: 90, y: 78, look: pell, pose: "carry" }) +
      part.snow(),
  },
  stair: {
    sky: ["#2f3640", "#5c6874"],
    back: () => part.stair({ color: "#c9d3dc" }),
    move: () =>
      part.figure({ x: 70, y: 50, scale: 1.1, look: wrenSnow, pose: "pull" }) +
      part.snow(),
  },
  rope: {
    sky: ["#cfd8e0", "#7e8e9c"],
    back: () => part.stair({ color: "#e9eef2" }),
    move: () =>
      part.line({ from: [60, 36], to: [100, 22] }) +
      part.figure({ x: 60, y: 58, look: wrenSnow, pose: "pull" }) +
      part.figure({ x: 84, y: 50, look: pell, pose: "pull" }),
  },
  loft: {
    sky: ["#3a3230", "#7a5a3a"],
    back: () => part.lantern({ x: 30, y: 30 }),
    move: () =>
      part.bell({ x: 82, y: 32, scale: 2.2 }) +
      part.line({ from: [82, 54], to: [82, 60] }) +
      part.figure({ x: 82, y: 88, scale: 1.2, look: wrenSnow, pose: "pull" }),
  },
  clear: {
    sky: ["#9cc6e6", "#e8f1f6"],
    back: () =>
      part.sun({ x: 122, y: 22, color: "#fff4d6" }) +
      part.sea({ y: 54, color: "#2f6f92" }),
    move: () =>
      part.boat({ x: 70, y: 62, scale: 0.7 }) + part.fog({ amount: 0.25 }),
  },
  boats: {
    sky: ["#f4cf9a", "#88a9c2"],
    back: () =>
      part.sea({ y: 54, color: "#3f6782" }) +
      part.tower({ x: 140, y: 56, scale: 0.6 }),
    move: () =>
      part.boat({ x: 30, y: 62, scale: 0.7 }) +
      part.boat({ x: 66, y: 66, scale: 0.9, color: "#c9573f" }) +
      part.boat({ x: 108, y: 72, scale: 1.2 }),
  },
  listen: {
    sky: ["#2a2c33", "#4a4f5a"],
    back: () => part.windowView(),
    move: () => part.figure({ x: 70, y: 84, scale: 1.4, look: odo }),
  },
};

const props = {
  "cracked bell": () => part.bell({ x: 80, y: 44, scale: 3, cracked: true }),
  "new bell": () => part.bell({ x: 80, y: 44, scale: 3 }),
  "ninth bell": () => part.bell({ x: 80, y: 44, scale: 3 }),
  "ferry lantern": () => part.lantern({ x: 80, y: 46, scale: 3 }),
  rope: () => part.rope({ x: 80, y: 50, scale: 3 }),
};

function turnaround({ look, fault }) {
  const back = fault ? { ...look, coat: "#6f6a3a" } : look;
  return (
    part.figure({ x: 40, y: 80, scale: 1.9, look }) +
    part.figure({
      x: 80,
      y: 80,
      scale: 1.9,
      look: { ...look },
      pose: "carry",
    }) +
    part.figure({ x: 120, y: 80, scale: 1.9, look: back, back: true })
  );
}

function poses({ look }) {
  return [...["stand", "reach", "pull", "wave"].entries()]
    .map(([index, pose]) =>
      part.figure({ x: 26 + index * 36, y: 80, scale: 1.6, look, pose }),
    )
    .join("");
}

function drawingOf(picture) {
  if (picture.kind === "scene") {
    const scene = scenes[picture.art];
    return { sky: scene.sky, back: scene.back(), move: scene.move() };
  }
  const look = cast[picture.character]?.looks[picture.look];
  const drawings = {
    turnaround: () => turnaround({ look, fault: picture.fault }),
    poses: () => poses({ look }),
    prop: () => props[picture.prop](),
  };
  return { sky: paper, back: "", move: drawings[picture.kind]() };
}

export function artMarkup(picture) {
  counter += 1;
  const id = `sky${counter}`;
  const drawing = drawingOf(picture);
  const variant = picture.variant ?? 0;
  const framing = `translate(${-variant * 10} ${-variant * 8}) scale(${1 + variant * 0.14})`;
  const mirror = picture.mirror ? "translate(160 0) scale(-1 1)" : "";
  return `<svg class="art" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${drawing.sky[0]}"/><stop offset="1" stop-color="${drawing.sky[1]}"/></linearGradient></defs>
    <rect width="160" height="90" fill="url(#${id})"/>
    <g transform="${mirror} ${framing}">${drawing.back}<g class="art-move">${drawing.move}</g></g>
  </svg>`;
}
