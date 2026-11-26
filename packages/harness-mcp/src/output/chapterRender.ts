import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  chapterFramesOf,
  chaptersOf,
  cutItemId,
  openTakeOf,
  type Edit,
} from "@yumekit/project";
import { renderVideo, type RenderScale } from "@yumekit/render";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import type { ProgressListener } from "../harness/toolTable.js";
import { failureResult, successResult } from "../results.js";
import { renderFailureOf } from "./renderFailures.js";

export function chapterFileOf(options: {
  chapterId: string;
  outputId: string;
}): string {
  return `renders/chapters/${options.chapterId}-${options.outputId}.mp4`;
}

export async function renderChapter(options: {
  context: HarnessContext;
  outputId: string;
  chapterId: string;
  scale: RenderScale | undefined;
  onProgress: ProgressListener | undefined;
}): Promise<CallToolResult> {
  const { context, outputId, chapterId, onProgress } = options;
  const snapshot = context.store.read();
  const chapters = chaptersOf(snapshot.bible.storyPlan);
  const frames = chapterFramesOf({ work: snapshot, outputId, chapterId });
  if (frames === undefined) {
    const isChapter = chapters.some((chapter) => chapter.id === chapterId);
    return failureResult({
      kind: isChapter ? "chapter-not-on-timeline" : "chapter-not-found",
      message: isChapter
        ? `No scene of chapter "${chapterId}" is on the timeline of "${outputId}".`
        : `The film has no chapter "${chapterId}".`,
      hint: isChapter
        ? "Place the clips of the chapter first, then render it."
        : `Use one of the chapters: ${chapters.map((chapter) => `"${chapter.id}"`).join(", ")}.`,
    });
  }
  const file = chapterFileOf({ chapterId, outputId });
  const destination = join(context.store.folder, file);
  await mkdir(join(context.store.folder, "renders", "chapters"), {
    recursive: true,
  });
  await rm(destination, { force: true });
  const rendered = await renderVideo({
    folder: context.store.folder,
    outputId,
    destination,
    ...frames,
    ...(options.scale === undefined ? {} : { scale: options.scale }),
    onProgress: ({ framesDone, frameCount }) => {
      onProgress?.({ done: framesDone, total: frameCount });
    },
  });
  if (!rendered.ok) return failureResult(renderFailureOf(rendered.failure));
  const video = rendered.value;
  const open = openTakeOf(context.store.read().takes);
  const joinsTake = open?.step === "cut" && open.chapterId === chapterId;
  const line = `Rendered chapter "${chapterId}": ${String(video.frameCount)} frames (${video.durationSeconds.toFixed(2)} seconds) from frame ${String(frames.firstFrame)} to ${file}.${joinsTake ? ` It is the cut of take ${String(open.number)}.` : ""}`;
  const data = {
    file: video.file,
    chapter_id: chapterId,
    first_frame: frames.firstFrame,
    frame_count: video.frameCount,
    duration_seconds: video.durationSeconds,
  };
  if (!joinsTake) return successResult({ line, data });
  const edits: Edit[] = [
    {
      kind: "fillTake",
      items: [{ kind: "cut", id: cutItemId, outputId, file }],
    },
  ];
  return applyEditsResult({ store: context.store, edits, line, data });
}
