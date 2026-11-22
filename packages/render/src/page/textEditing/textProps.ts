export type TextPropPath = (string | number)[];

export const textPropAttribute = "data-text-prop";
export const editableTextAttribute = "data-text-editable";
const sceneIdAttribute = "data-scene-id";

export interface TextTarget {
  sceneId: string;
  path: TextPropPath;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function textPropPathOf(mark: string | null): TextPropPath | undefined {
  if (mark === null) return undefined;
  const segments = mark.split(".");
  if (segments.some((segment) => segment.trim() === "")) return undefined;
  return segments.map((segment) =>
    /^\d+$/.test(segment) ? Number(segment) : segment,
  );
}

export function canHoldText(options: {
  props: unknown;
  path: TextPropPath;
}): boolean {
  let value = options.props;
  for (const segment of options.path) {
    if (value === undefined) return true;
    if (typeof segment === "number") {
      if (!Array.isArray(value)) return false;
      const list: unknown[] = value;
      value = list[segment];
    } else {
      if (!isRecord(value)) return false;
      value = Object.hasOwn(value, segment) ? value[segment] : undefined;
    }
  }
  return value === undefined || typeof value === "string";
}

export function textTargetOf(element: Element): TextTarget | undefined {
  const path = textPropPathOf(element.getAttribute(textPropAttribute));
  const sceneId = element
    .closest(`[${sceneIdAttribute}]`)
    ?.getAttribute(sceneIdAttribute);
  return path === undefined || sceneId === undefined || sceneId === null
    ? undefined
    : { sceneId, path };
}

export function currentTextElementOf(options: {
  root: HTMLElement;
  element: HTMLElement;
}): HTMLElement | undefined {
  const { root, element } = options;
  if (element.isConnected) return element;
  const target = textTargetOf(element);
  if (target === undefined) return undefined;
  const found = root.querySelector(
    `[${sceneIdAttribute}="${CSS.escape(target.sceneId)}"] [${textPropAttribute}="${CSS.escape(target.path.join("."))}"][${editableTextAttribute}]`,
  );
  return found instanceof HTMLElement ? found : undefined;
}

export function markEditableTexts(options: {
  root: HTMLElement;
  propsOf: (sceneId: string) => unknown;
}): void {
  for (const element of options.root.querySelectorAll(
    `[${textPropAttribute}]`,
  )) {
    const target = textTargetOf(element);
    const props =
      target === undefined ? undefined : options.propsOf(target.sceneId);
    element.toggleAttribute(
      editableTextAttribute,
      target !== undefined &&
        props !== undefined &&
        canHoldText({ props, path: target.path }),
    );
  }
}
