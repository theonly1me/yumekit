import { useCallback, useEffect, useRef, useState } from "react";
import { failureTextOf } from "../../tools/requestText.js";
import type { FileUpload } from "./fileUpload.js";
import {
  fileKindOf,
  notReadable,
  type PendingFile,
  type PendingState,
  type SentFileInput,
} from "./pendingFile.js";

export type PendingFiles = ReturnType<typeof usePendingFiles>;

export type UploadOutcome =
  { ok: true; files: SentFileInput[] } | { ok: false };

function pendingOf(file: File): PendingFile {
  const kind = fileKindOf(file);
  return {
    id: crypto.randomUUID(),
    file,
    kind,
    previewUrl: kind === "picture" ? URL.createObjectURL(file) : undefined,
    state:
      kind === "other"
        ? { kind: "failed", message: notReadable, canRetry: false }
        : { kind: "waiting" },
  };
}

function cannotGo(file: PendingFile): boolean {
  return file.state.kind === "failed" && !file.state.canRetry;
}

function forget(files: PendingFile[]): void {
  for (const file of files) {
    if (file.previewUrl !== undefined) URL.revokeObjectURL(file.previewUrl);
  }
}

export function usePendingFiles(options: {
  upload: FileUpload;
  onText: (text: { name: string; text: string }) => string | undefined;
}) {
  const { upload, onText } = options;
  const [items, setItems] = useState<PendingFile[]>([]);
  const current = useRef<PendingFile[]>([]);
  const setBoth = useCallback(
    (next: (files: PendingFile[]) => PendingFile[]) => {
      current.current = next(current.current);
      setItems(current.current);
    },
    [],
  );
  const setState = useCallback(
    (change: { id: string; state: PendingState }) => {
      setBoth((files) =>
        files.map((file) =>
          file.id === change.id ? { ...file, state: change.state } : file,
        ),
      );
    },
    [setBoth],
  );
  useEffect(
    () => () => {
      forget(current.current);
    },
    [],
  );

  const addText = async (file: File) => {
    const problem = onText({ name: file.name, text: await file.text() });
    if (problem === undefined) return;
    const failed = pendingOf(file);
    setBoth((files) => [
      ...files,
      {
        ...failed,
        state: { kind: "failed", message: problem, canRetry: false },
      },
    ]);
  };

  const uploadOne = async (options: {
    file: PendingFile;
    actId: string;
  }): Promise<SentFileInput | undefined> => {
    const { file } = options;
    if (file.state.kind === "added") {
      return { assetId: file.state.assetId, name: file.file.name };
    }
    setState({ id: file.id, state: { kind: "adding" } });
    const uploaded = await upload({ file: file.file, actId: options.actId });
    if (!uploaded.ok) {
      const message = failureTextOf(uploaded.failure);
      setState({
        id: file.id,
        state: { kind: "failed", message, canRetry: true },
      });
      return undefined;
    }
    const assetId = uploaded.value;
    setState({ id: file.id, state: { kind: "added", assetId } });
    return { assetId, name: file.file.name };
  };

  return {
    items,
    isAdding: items.some((file) => file.state.kind === "adding"),
    add: (files: File[]) => {
      for (const file of files) {
        if (fileKindOf(file) === "text") addText(file).catch(() => undefined);
      }
      const media = files.filter((file) => fileKindOf(file) !== "text");
      setBoth((existing) => [...existing, ...media.map(pendingOf)]);
    },
    remove: (id: string) => {
      forget(current.current.filter((file) => file.id === id));
      setBoth((files) => files.filter((file) => file.id !== id));
    },
    clear: () => {
      forget(current.current);
      setBoth(() => []);
    },
    upload: async (): Promise<UploadOutcome> => {
      if (current.current.some(cannotGo)) return { ok: false };
      const actId = crypto.randomUUID();
      const sent: SentFileInput[] = [];
      for (const file of current.current) {
        const uploaded = await uploadOne({ file, actId });
        if (uploaded !== undefined) sent.push(uploaded);
      }
      return sent.length === current.current.length
        ? { ok: true, files: sent }
        : { ok: false };
    },
  };
}
