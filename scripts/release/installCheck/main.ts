import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { installCheckEnvironment } from "./checkEnvironment.ts";
import { startMcpSession } from "./mcpSession.ts";
import { checkEditorPage } from "./openEditor.ts";
import { runOrStop } from "./processes.ts";
import {
  buildVideoProject,
  checkLocalMusic,
  listLocalVoice,
  makeSampleAsset,
} from "./videoProject.ts";

const releaseFolder = fileURLToPath(
  new URL("../../../release", import.meta.url),
);

async function packedFileOf(argument: string | undefined): Promise<string> {
  if (argument !== undefined) return argument;
  const [packed] = (await readdir(releaseFolder)).filter((name) =>
    name.endsWith(".tgz"),
  );
  if (packed === undefined) {
    throw new Error("No packed file. Run pnpm run pack-release first.");
  }
  return join(releaseFolder, packed);
}

async function step(options: {
  name: string;
  work: () => Promise<string>;
}): Promise<void> {
  const started = Date.now();
  const detail = await options.work();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`ok ${options.name} (${seconds} s) ${detail}`);
}

const { values, positionals } = parseArgs({
  options: { global: { type: "boolean", default: false } },
  allowPositionals: true,
});
const packedFile = await packedFileOf(positionals[0]);
const folder = await mkdtemp(join(tmpdir(), "yumekit-install-check-"));
const prefix = join(folder, "prefix");
const installPlace = values.global ? ["--global", "--prefix", prefix] : [];
const yumekit = values.global
  ? join(prefix, "bin", "yumekit")
  : join(folder, "node_modules", ".bin", "yumekit");
const projectFolder = join(folder, "video");
const place = {
  cwd: folder,
  environment: await installCheckEnvironment({
    folder,
    environment: process.env,
  }),
};
try {
  await writeFile(join(folder, "package.json"), '{ "private": true }\n');
  await step({
    name: values.global ? "npm install --global" : "npm install",
    work: () =>
      runOrStop({
        command: "npm",
        args: [
          ...["install", "--no-audit", "--no-fund", packedFile],
          ...["--cache", join(folder, "npm-cache"), ...installPlace],
        ],
        ...place,
      }),
  });
  await step({
    name: "yumekit --version",
    work: () => runOrStop({ command: yumekit, args: ["--version"], ...place }),
  });
  await step({
    name: "yumekit init",
    work: () =>
      runOrStop({
        command: yumekit,
        args: ["init", projectFolder, "--output", "wide:320x180"],
        ...place,
      }),
  });
  const session = await startMcpSession({
    command: yumekit,
    args: ["mcp", "--project", projectFolder],
    ...place,
  });
  try {
    await step({
      name: "yumekit mcp tools/list",
      work: async () => {
        const listed = JSON.stringify(
          await session.request({ method: "tools/list", params: {} }),
        );
        if (!listed.includes('"put_scene"')) {
          throw new Error(`tools/list has no put_scene: ${listed}`);
        }
        return `${String(listed.match(/"inputSchema"/g)?.length ?? 0)} tools`;
      },
    });
    await step({
      name: "a kit scene and a custom scene",
      work: async () => {
        await buildVideoProject(session);
        return "";
      },
    });
    await step({
      name: "the local voice server starts",
      work: () => listLocalVoice(session),
    });
    await step({
      name: "the local music server starts with approved styles only",
      work: () => checkLocalMusic(session),
    });
    await step({
      name: "the sample media server makes an asset",
      work: async () => (await makeSampleAsset(session)).slice(0, 120),
    });
  } finally {
    await session.close();
  }
  await step({
    name: "yumekit render",
    work: async () => {
      await runOrStop({
        command: yumekit,
        args: ["render", "--project", projectFolder, "--output", "wide"],
        ...place,
      });
      return runOrStop({
        command: "ffprobe",
        args: [
          ...["-v", "error", "-count_frames", "-select_streams", "v:0"],
          ...["-show_entries", "stream=codec_name,width,height,nb_read_frames"],
          ...["-of", "csv=p=0", join(projectFolder, "renders", "wide.mp4")],
        ],
        ...place,
      });
    },
  });
  await step({
    name: "yumekit open --no-browser",
    work: () =>
      checkEditorPage({
        command: yumekit,
        args: ["open", projectFolder, "--no-browser"],
        ...place,
      }),
  });
  await step({
    name: "yumekit --no-browser",
    work: () =>
      checkEditorPage({
        command: yumekit,
        args: ["--no-browser"],
        ...place,
      }),
  });
} finally {
  await rm(folder, { recursive: true, force: true });
}
