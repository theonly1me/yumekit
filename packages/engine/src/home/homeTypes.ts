import type { PlatformId } from "@yumekit/project";
import { z } from "zod";

export const projectLengthSchema = z.union([
  z.literal(15),
  z.literal(30),
  z.literal(60),
  z.literal("auto"),
]);

export type ProjectLength = z.infer<typeof projectLengthSchema>;

export interface RecentProject {
  folder: string;
  name: string;
  platforms: PlatformId[];
  length: ProjectLength | null;
  changedAt: string;
}

export interface HomeServer {
  url: string;
  token: string;
  close: () => Promise<void>;
}

export interface HomeFailure {
  kind: "port-not-free";
  port: number;
}

export interface EngineAddress {
  url: string;
  origin: string;
  token: string;
}
