export const chatWidths = { smallest: 320, largest: 720, standard: 400 };

export const keyStepPixels = 24;

const storeKey = "yumekit-chat-width";
const widthProperty = "--chat-width";

export function clampedWidth(width: number): number {
  return Math.round(
    Math.min(chatWidths.largest, Math.max(chatWidths.smallest, width)),
  );
}

export function storedWidth(): number {
  try {
    const stored = Number(localStorage.getItem(storeKey));
    return stored > 0 ? clampedWidth(stored) : chatWidths.standard;
  } catch {
    return chatWidths.standard;
  }
}

export function showWidth(width: number): void {
  document.documentElement.style.setProperty(
    widthProperty,
    `${String(width)}px`,
  );
}

export function forgetShownWidth(): void {
  document.documentElement.style.removeProperty(widthProperty);
}

export function saveWidth(width: number): void {
  try {
    localStorage.setItem(storeKey, String(width));
  } catch {
    return;
  }
}
