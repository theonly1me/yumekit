import type { RenderFailure } from "@yumekit/render";
import type { HarnessFailure } from "../results.js";

function hintOf(failure: RenderFailure): string {
  switch (failure.kind) {
    case "output-not-found":
      return "Call get_project and use one of its output ids.";
    case "frame-out-of-range":
      return `The output has ${String(failure.frameCount)} frames, numbered 0 to ${String(failure.frameCount - 1)}. Ask for a frame in that range. If the output has 0 frames, add clips with set_timeline first.`;
    case "scene-import-not-permitted":
    case "scene-compile-failed":
      return `Fix the code of scene "${failure.sceneId}" with put_scene. Call get_scene to read it and get_scene_guide for the rules.`;
    case "kit-scene-not-found":
      return `Replace scene "${failure.sceneId}" with put_scene and a kit_component from list_kit_scenes.`;
    case "scene-error":
      return `Scene "${failure.sceneId}" failed at output frame ${String(failure.frame)}. Read it with get_scene, fix it with put_scene, and preview that frame again. For a custom scene, check each prop before use.`;
    case "scene-not-repeatable":
      return `Scenes ${failure.sceneIds.join(", ")} draw a different picture for the same frame. Remove Date, Math.random, timers, and CSS animations from their code. See get_scene_guide.`;
    case "media-not-readable":
      return "Ask the user for a complete image, audio, or video file, then call import_asset again.";
    case "browser-not-installed":
    case "ffmpeg-not-found":
    case "encode-failed":
    case "project-invalid":
      return `${failure.hint ?? ""} Ask the user to fix this; no harness tool can.`.trim();
  }
}

export function renderFailureOf(failure: RenderFailure): HarnessFailure {
  return {
    kind: failure.kind,
    message: failure.message,
    hint: hintOf(failure),
  };
}
