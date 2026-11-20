import { kitSceneSchemas } from "@yumekit/scene-kit/schemas";
import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { successResult } from "../results.js";
import { sceneGuide } from "../sceneGuide/index.js";

const readOnly = { readOnlyHint: true } as const;

function registerListKitScenes(context: HarnessContext): void {
  context.server.registerTool(
    "list_kit_scenes",
    {
      description:
        "List the ready kit scenes: name, purpose, and the JSON schema of the props. Use a name as kit_component in put_scene. Prefer a kit scene to custom code.",
      annotations: readOnly,
    },
    () => {
      const kitScenes = Object.entries(kitSceneSchemas).map(
        ([name, schema]) => ({
          name,
          purpose: schema.purpose,
          props: z.toJSONSchema(schema.props),
        }),
      );
      return successResult({
        line: `${String(kitScenes.length)} kit scenes: ${kitScenes.map((kitScene) => kitScene.name).join(", ")}.`,
        data: { kit_scenes: kitScenes },
      });
    },
  );
}

function registerGetSceneGuide(context: HarnessContext): void {
  context.server.registerTool(
    "get_scene_guide",
    {
      description:
        "Read the full reference for custom scene code: the contract, each hook, each animation function, the rules, the paper style values, and two complete examples. Call it before you send code to put_scene.",
      annotations: readOnly,
    },
    () => ({
      content: [
        { type: "text", text: "The custom scene guide." },
        { type: "text", text: sceneGuide },
      ],
      structuredContent: { guide: sceneGuide },
    }),
  );
}

function registerListMediaTools(context: HarnessContext): void {
  context.server.registerTool(
    "list_media_tools",
    {
      description:
        'List each connected media server and its capabilities (image, speech, align, music, video), and each server that failed to start with the reason. Use a server name as server in generate_asset. The server "sample" is a free test server: its image tool draws the prompt as text on a plain color, and its speech tool makes a tone with even word timings, not a voice. Use it to test a project, not for a real video.',
      annotations: readOnly,
    },
    () => {
      const servers = context.mediaTools.list();
      const failedServers = context.mediaTools.failedServers();
      return successResult({
        line: `Media servers connected: ${String(servers.length)}. Failed to start: ${String(failedServers.length)}.`,
        data: { servers, failed_servers: failedServers },
      });
    },
  );
}

export function registerReferenceTools(context: HarnessContext): void {
  registerListKitScenes(context);
  registerGetSceneGuide(context);
  registerListMediaTools(context);
}
