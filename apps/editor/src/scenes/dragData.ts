import type { DragEvent } from "react";

export type DragKind = "scene" | "chapter" | "line" | "take-item";

const dragTypes: Record<DragKind, string> = {
  scene: "application/x-yumekit-scene",
  chapter: "application/x-yumekit-chapter",
  line: "application/x-yumekit-line",
  "take-item": "application/x-yumekit-take-item",
};

const dragKinds: DragKind[] = ["scene", "chapter", "line", "take-item"];

export function startDrag(options: {
  event: DragEvent;
  kind: DragKind;
  id: string;
}): void {
  const { dataTransfer } = options.event;
  dataTransfer.effectAllowed = options.kind === "take-item" ? "copy" : "move";
  dataTransfer.setData(dragTypes[options.kind], options.id);
}

export function dragKindOf(event: DragEvent): DragKind | undefined {
  const types = [...event.dataTransfer.types];
  return dragKinds.find((kind) => types.includes(dragTypes[kind]));
}

export function droppedOf(
  event: DragEvent,
): { kind: DragKind; id: string } | undefined {
  const kind = dragKindOf(event);
  if (kind === undefined) return undefined;
  const id = event.dataTransfer.getData(dragTypes[kind]);
  return id === "" ? undefined : { kind, id };
}

export function dropTargetProps(options: {
  accepts: DragKind[];
  onOver: (kind: DragKind | undefined) => void;
  onDrop: (dropped: { kind: DragKind; id: string }) => void;
}) {
  return {
    onDragOver: (event: DragEvent) => {
      const kind = dragKindOf(event);
      if (kind === undefined || !options.accepts.includes(kind)) return;
      event.preventDefault();
      options.onOver(kind);
    },
    onDragLeave: () => {
      options.onOver(undefined);
    },
    onDrop: (event: DragEvent) => {
      options.onOver(undefined);
      const dropped = droppedOf(event);
      if (dropped === undefined || !options.accepts.includes(dropped.kind)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      options.onDrop(dropped);
    },
  };
}
