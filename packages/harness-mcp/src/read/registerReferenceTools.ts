import { kitSceneSchemas, looks } from "@yumekit/scene-kit/schemas";
import { z } from "zod";
import type { HarnessContext } from "../context.js";
import {
  generatedVideoSecondsOf,
  roundedSeconds,
} from "../media/videoLimit.js";
import { successResult } from "../results.js";
import { wireMediaServerOf } from "./mediaServerList.js";
import { sceneGuide } from "../sceneGuide/index.js";

const readOnly = { readOnlyHint: true } as const;

function registerListKitScenes(context: HarnessContext): void {
  context.tools.add({
    name: "list_kit_scenes",
    description:
      "List the ready kit scenes: name, purpose, and the JSON schema of the props, and the looks with one line for each. Use a name as kit_component in put_scene. Prefer a kit scene to custom code. Each kit scene draws in the look of the project; set_look changes it.",
    inputSchema: {},
    annotations: readOnly,
    run: () => {
      const kitScenes = Object.entries(kitSceneSchemas).map(
        ([name, schema]) => ({
          name,
          purpose: schema.purpose,
          props: z.toJSONSchema(schema.props),
        }),
      );
      return successResult({
        line: `${String(kitScenes.length)} kit scenes: ${kitScenes.map((kitScene) => kitScene.name).join(", ")}. ${String(looks.length)} looks: ${looks.map((look) => look.id).join(", ")}.`,
        data: {
          kit_scenes: kitScenes,
          looks: looks.map((look) => ({
            id: look.id,
            label: look.label,
            line: look.line,
          })),
        },
      });
    },
  });
}

function registerGetSceneGuide(context: HarnessContext): void {
  context.tools.add({
    name: "get_scene_guide",
    description:
      "Read the full reference for custom scene code: the contract, each hook, each animation function, the rules, the tokens of the look, the rules and functions of motion design, the camera moves of a video clip, and three complete examples. Call it before you send code to put_scene.",
    inputSchema: {},
    annotations: readOnly,
    run: () => ({
      content: [
        { type: "text", text: "The custom scene guide." },
        { type: "text", text: sceneGuide },
      ],
      structuredContent: { guide: sceneGuide },
    }),
  });
}

function registerListMediaTools(context: HarnessContext): void {
  context.tools.add({
    name: "list_media_tools",
    description:
      'List each connected media server and its capabilities (image, speech, align, music, video, sound-effect, sharper), and each server that failed to start with the reason. Use a server name as server in generate_asset. The server "sample" is a free test server: its image tool draws the prompt as text on a plain color, its speech tool makes a tone with even word timings, not a voice, its video tool makes a plain color with a frame counter and a tone, its sound effect tool makes a short tone, and its sharper tool makes a plain larger copy. It costs nothing. Use it to test a project, not for a real video. A server with a description gives its label, where it runs, and its models with the settings, the prices in US dollars with the date they were read, and the default model of each capability. Use a model id as model in generate_asset. accepts lists the pictures that a model takes: first_frame, last_frame, and reference_images. For a sharper model, accepts has image_input for pictures or video_input for video. tested false means that the model had no real call with yumekit yet, so say so to the person before a paid call. keys gives each key that the server needs, its source (environment, key-file, or missing), get_key_url, and steps. can_check_key says if the server has the check_key tool, which the editor uses to test a key. Never ask for the value of a key: if one is missing, tell the person the steps and to add the key in the editor under Tools or with yumekit keys set. generated_video gives limit_seconds and used_seconds of generated video in this project.',
    inputSchema: {},
    annotations: readOnly,
    run: async () => {
      const servers = await Promise.all(
        context.mediaTools.list().map(wireMediaServerOf),
      );
      const failedServers = context.mediaTools.failedServers();
      const generatedVideo = {
        limit_seconds: context.mediaTools.limits().generatedVideoSeconds,
        used_seconds: roundedSeconds(
          generatedVideoSecondsOf(context.store.read()),
        ),
      };
      return successResult({
        line: `Media servers connected: ${String(servers.length)}. Failed to start: ${String(failedServers.length)}. Generated video: ${String(generatedVideo.used_seconds)} of ${String(generatedVideo.limit_seconds)} seconds used.`,
        data: {
          servers,
          failed_servers: failedServers,
          generated_video: generatedVideo,
        },
      });
    },
  });
}

export function registerReferenceTools(context: HarnessContext): void {
  registerListKitScenes(context);
  registerGetSceneGuide(context);
  registerListMediaTools(context);
}
