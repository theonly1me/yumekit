import {
  useEffect,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from "react";

function carriesFiles(transfer: DataTransfer | null): boolean {
  return transfer?.types.includes("Files") ?? false;
}

function keepPageOnStrayDrop(event: globalThis.DragEvent): void {
  if (carriesFiles(event.dataTransfer)) event.preventDefault();
}

export function useDropZone(onFiles: (files: File[]) => void) {
  const [isDragging, setDragging] = useState(false);

  useEffect(() => {
    window.addEventListener("dragover", keepPageOnStrayDrop);
    window.addEventListener("drop", keepPageOnStrayDrop);
    return () => {
      window.removeEventListener("dragover", keepPageOnStrayDrop);
      window.removeEventListener("drop", keepPageOnStrayDrop);
    };
  }, []);

  return {
    isDragging,
    zoneProps: {
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!carriesFiles(event.dataTransfer)) return;
        event.preventDefault();
        setDragging(true);
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setDragging(false);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!carriesFiles(event.dataTransfer)) return;
        event.preventDefault();
        setDragging(false);
        onFiles([...event.dataTransfer.files]);
      },
      onPaste: (event: ClipboardEvent<HTMLElement>) => {
        const files = [...event.clipboardData.files];
        if (files.length === 0) return;
        event.preventDefault();
        onFiles(files);
      },
    },
  };
}
