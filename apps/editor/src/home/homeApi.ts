import { z } from "zod";
import type { FileUpload, SentFileInput } from "../chat/files/index.js";
import type { EngineClient } from "../engine/engineClient.js";
import type { VideoStyleId } from "../videoStyle/videoStyles.js";
import type { StartForm } from "./templates.js";

const lengthSchema = z.union([
  z.literal(15),
  z.literal(30),
  z.literal(60),
  z.literal("auto"),
]);

const recentSchema = z.object({
  folder: z.string(),
  name: z.string(),
  platforms: z.array(z.string()),
  length: lengthSchema.nullable(),
  changedAt: z.string(),
});

const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  installed: z.boolean(),
  in_use: z.boolean(),
  sign_in: z.enum(["signed-in", "signed-out", "unknown"]).nullable(),
});

const homeSchema = z.object({
  recent: z.array(recentSchema),
  agents: z.array(agentSchema),
  projects_folder: z.string(),
  generated_video_limit_seconds: z.number().nullable(),
});

const openedSchema = z.object({ url: z.string() });

export type ProjectLength = z.infer<typeof lengthSchema>;
export type RecentProject = z.infer<typeof recentSchema>;
export type HomeAgent = z.infer<typeof agentSchema>;
export type HomeFacts = z.infer<typeof homeSchema>;

export const projectLengths: readonly ProjectLength[] = [15, 30, 60, "auto"];

export function readHome(client: EngineClient) {
  return client.readJson({ path: "/api/home", schema: homeSchema });
}

export function makeProject(options: {
  client: EngineClient;
  request: string;
  platformIds: string[];
  length: ProjectLength;
  videoStyle: VideoStyleId;
  form: StartForm | undefined;
  files: SentFileInput[];
}) {
  return options.client.readJson({
    path: "/api/home/projects",
    schema: openedSchema,
    body: {
      request: options.request,
      platform_ids: options.platformIds,
      length: options.length,
      video_style: options.videoStyle,
      ...(options.form === undefined ? {} : { form: options.form }),
      files: options.files.map((file) => ({
        upload_id: file.assetId,
        name: file.name,
      })),
    },
  });
}

const stagedSchema = z.object({ upload: z.object({ id: z.string() }) });

export function stagedUploadOf(client: EngineClient): FileUpload {
  return async ({ file }) => {
    const staged = await client.readJson({
      path: `/api/home/uploads?${new URLSearchParams({ name: file.name }).toString()}`,
      schema: stagedSchema,
      file,
    });
    return staged.ok ? { ok: true, value: staged.value.upload.id } : staged;
  };
}

export function openRecent(options: { client: EngineClient; folder: string }) {
  return options.client.readJson({
    path: "/api/home/open",
    schema: openedSchema,
    body: { folder: options.folder },
  });
}
