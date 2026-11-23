import { loadStylePackFonts, stylePackOf } from "@yumekit/scene-kit";
import { listenForTextEdits, markEditableTexts } from "./textEditing/index.js";
import { createPageStage, type PageStage } from "./pageStage.js";
import {
  isPreviewData,
  previewDataPath,
  previewEventsPath,
  type PreviewData,
} from "./previewData.js";
import {
  parentRequestOf,
  permittedOriginOf,
  type PreviewReply,
  type SeekRequest,
} from "./previewMessages.js";
import { createSceneErrorLog } from "./sceneErrorLog.js";
import { messageOf } from "./sceneFailure.js";

type LoadedPreview =
  | {
      ok: true;
      stage: PageStage;
      frameCount: number;
      propsOfScene: Map<string, unknown>;
    }
  | { ok: false; kind: string; message: string };

const parameters = new URLSearchParams(window.location.search);
const outputId = parameters.get("output") ?? "";
const parentOrigin = permittedOriginOf(parameters.get("parentOrigin"));
const stageElement = document.querySelector<HTMLElement>("#stage");
const errorLog = createSceneErrorLog();
let loaded: LoadedPreview = {
  ok: false,
  kind: "preview-not-ready",
  message: "The preview is not ready",
};
let lastSeek: SeekRequest | undefined;
let shownFrame: number | undefined;
let pendingWork = Promise.resolve();

function reply(message: PreviewReply): void {
  if (parentOrigin !== undefined) {
    window.parent.postMessage(message, parentOrigin);
  }
}

async function fetchPreviewData(): Promise<PreviewData> {
  const response = await fetch(
    `${previewDataPath}?output=${encodeURIComponent(outputId)}`,
  );
  const body: unknown = await response.json();
  if (!isPreviewData(body)) {
    throw new Error("The preview data is not valid");
  }
  return body;
}

async function load(): Promise<void> {
  const data = await fetchPreviewData();
  if (loaded.ok) {
    loaded.stage.dispose();
  }
  const element = stageElement;
  if (!data.ok || element === null) {
    loaded = data.ok
      ? { ok: false, kind: "preview-not-ready", message: "No #stage element" }
      : data;
    return;
  }
  await loadStylePackFonts(stylePackOf(data.pageData.look));
  const moduleSceneUrls = new Map(Object.entries(data.moduleSceneUrls));
  const stage = createPageStage({
    element,
    pageData: data.pageData,
    importModuleScene: async (sceneId) => {
      const url = moduleSceneUrls.get(sceneId);
      if (url === undefined) {
        throw new Error(`The preview page has no code for scene "${sceneId}"`);
      }
      const importModule = window.yumekitImport;
      if (importModule === undefined) {
        throw new Error("The preview page has no module importer");
      }
      return importModule(url);
    },
    errorLog,
    mode: "preview",
  });
  const propsOfScene = new Map<string, unknown>(
    data.pageData.project.scenes.map((scene) => [scene.id, scene.props]),
  );
  loaded = { ok: true, stage, frameCount: data.frameCount, propsOfScene };
}

function isFrameInRange(options: { frame: number; frameCount: number }) {
  return (
    Number.isInteger(options.frame) &&
    options.frame >= 0 &&
    options.frame < options.frameCount
  );
}

async function draw(request: SeekRequest): Promise<PreviewReply> {
  const { frame, requestId } = request;
  if (!loaded.ok) {
    return {
      type: "failed",
      requestId,
      kind: loaded.kind,
      message: loaded.message,
    };
  }
  if (!isFrameInRange({ frame, frameCount: loaded.frameCount })) {
    return {
      type: "failed",
      requestId,
      kind: "frame-out-of-range",
      message: `Frame ${String(frame)} is outside the output, which has ${String(loaded.frameCount)} frames`,
    };
  }
  errorLog.takeErrors();
  const result = await loaded.stage.seek(frame);
  const { propsOfScene } = loaded;
  if (stageElement !== null) {
    markEditableTexts({
      root: stageElement,
      propsOf: (sceneId) => propsOfScene.get(sceneId),
    });
  }
  if (result.ok) shownFrame = frame;
  return result.ok
    ? { type: "sought", requestId }
    : {
        type: "failed",
        requestId,
        kind: result.kind,
        message: result.message,
        sceneId: result.sceneId,
      };
}

async function refresh(): Promise<void> {
  await load();
  const redrawn = lastSeek === undefined ? undefined : await draw(lastSeek);
  if (redrawn?.type === "failed") {
    reply(redrawn);
  }
  reply({ type: "ready", frameCount: loaded.ok ? loaded.frameCount : 0 });
}

function enqueue(work: () => Promise<void>): void {
  pendingWork = pendingWork.then(work).catch((error: unknown) => {
    reply({
      type: "failed",
      requestId: lastSeek?.requestId ?? 0,
      kind: "preview-failed",
      message: messageOf(error),
    });
  });
}

window.addEventListener("message", (event) => {
  const request = parentRequestOf(event.data);
  if (
    parentOrigin === undefined ||
    event.origin !== parentOrigin ||
    event.source !== window.parent ||
    request === undefined
  ) {
    return;
  }
  if (request.type === "reload") {
    enqueue(refresh);
    return;
  }
  enqueue(async () => {
    lastSeek = request;
    reply(await draw(request));
  });
});

if (stageElement !== null) {
  listenForTextEdits({
    root: stageElement,
    enqueue,
    reply,
    redraw: refresh,
    shownFrame: () => shownFrame,
  });
}
const events = new EventSource(previewEventsPath);
events.addEventListener("open", () => {
  enqueue(refresh);
});
events.addEventListener("message", () => {
  enqueue(refresh);
});
