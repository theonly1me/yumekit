import type { Page } from "playwright";
import type { RunningEngine } from "./runEngine.js";

const sentence =
  "The hero walks down the empty street at night, and the lanterns sway in the wind. ";

export const longRequestText = sentence
  .repeat(Math.ceil(6_000 / sentence.length))
  .slice(0, 6_000)
  .trim();

export async function sendOverHttp(options: {
  engine: RunningEngine;
  text: string;
}): Promise<void> {
  const response = await fetch(`${options.engine.origin}/api/chat/requests`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${options.engine.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ text: options.text, about_clip_id: null }),
  });
  if (!response.ok) {
    throw new Error(`The request failed: ${await response.text()}`);
  }
}

export interface LayoutFacts {
  windowHeight: number;
  pageHeight: number;
  pageWidth: number;
  windowWidth: number;
  chatPaneHeight: number;
  boxHeight: number;
  boxScrolls: boolean;
  sendBottom: number;
}

export function layoutOf(page: Page): Promise<LayoutFacts> {
  return page.evaluate(() => {
    const heightOf = (selector: string) =>
      document.querySelector(selector)?.getBoundingClientRect().height ?? 0;
    const box = document.querySelector("#ask-box");
    const send = document.querySelector(".ask-foot button:last-child");
    return {
      windowHeight: window.innerHeight,
      pageHeight: document.documentElement.scrollHeight,
      pageWidth: document.documentElement.scrollWidth,
      windowWidth: document.documentElement.clientWidth,
      chatPaneHeight: heightOf(".chat-pane"),
      boxHeight: heightOf("#ask-box"),
      boxScrolls: box !== null && box.scrollHeight > box.clientHeight + 1,
      sendBottom: send?.getBoundingClientRect().bottom ?? Infinity,
    };
  });
}
