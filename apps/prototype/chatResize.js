const storeKey = "yumekit-chat-width";
const defaultWidth = 400;
const smallest = 320;
const largest = 720;

function clampWidth(width) {
  return Math.round(Math.min(largest, Math.max(smallest, width)));
}

function storedWidth() {
  try {
    const stored = Number(localStorage.getItem(storeKey));
    return stored > 0 ? clampWidth(stored) : defaultWidth;
  } catch {
    return defaultWidth;
  }
}

function applyWidth(width) {
  document.documentElement.style.setProperty("--chat-width", `${width}px`);
  document.querySelectorAll("[data-chat-edge]").forEach((edge) => {
    edge.setAttribute("aria-valuenow", String(width));
  });
}

function saveWidth(width) {
  applyWidth(width);
  try {
    localStorage.setItem(storeKey, String(width));
  } catch {
    return;
  }
}

export function chatEdgeMarkup() {
  return `<span class="chat-edge" data-chat-edge role="separator" aria-orientation="vertical" tabindex="0" aria-label="Width of the chat. Drag, or use the arrow keys. Double click to reset." aria-valuemin="${smallest}" aria-valuemax="${largest}" aria-valuenow="${storedWidth()}" title="Drag to make the chat wider or narrower. Double click to reset."></span>`;
}

export function bindChatEdge(element) {
  const edge = element.querySelector("[data-chat-edge]");
  if (edge === null) {
    return;
  }
  edge.addEventListener("dblclick", () => saveWidth(defaultWidth));
  edge.addEventListener("keydown", (event) => {
    const step = { ArrowLeft: 24, ArrowRight: -24 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      saveWidth(clampWidth(storedWidth() + step));
    }
  });
  edge.addEventListener("pointerdown", (down) => {
    down.preventDefault();
    edge.setPointerCapture(down.pointerId);
    const start = storedWidth();
    let width = start;
    const move = (event) => {
      width = clampWidth(start + down.clientX - event.clientX);
      applyWidth(width);
    };
    const up = () => {
      edge.removeEventListener("pointermove", move);
      edge.removeEventListener("pointerup", up);
      saveWidth(width);
    };
    edge.addEventListener("pointermove", move);
    edge.addEventListener("pointerup", up);
  });
}

export function restoreChatWidth() {
  applyWidth(storedWidth());
}
