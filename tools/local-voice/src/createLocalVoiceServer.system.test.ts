import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ProgramCall } from "./systemVoice/runProgram.ts";
import {
  connectLocalVoice,
  fakeSay,
  noProgram,
  resultText,
  temporaryFolder,
} from "./testing/connectLocalVoice.ts";

async function speak(options: {
  platform: NodeJS.Platform;
  calls: ProgramCall[];
  arguments?: Record<string, unknown>;
  runProgram?: Parameters<typeof connectLocalVoice>[0]["runProgram"];
}) {
  const folder = await temporaryFolder();
  const voice = await connectLocalVoice({
    platform: options.platform,
    runProgram:
      options.runProgram ?? fakeSay({ calls: options.calls, seconds: 1.5 }),
    configurationFolder: join(folder, "config"),
  });
  const result = await voice.callTool({
    name: "generate_speech",
    arguments: {
      text: "-Hello from yumekit.",
      output_directory: join(folder, "assets"),
      file_stem: "hello",
      ...options.arguments,
    },
  });
  return { result, folder };
}

describe("generate_speech with the voice of this computer", () => {
  it("speaks the text with the best English voice of macOS into a WAV file with its length", async () => {
    const calls: ProgramCall[] = [];

    const { result, folder } = await speak({ platform: "darwin", calls });

    expect(result.structuredContent).toEqual({
      files: [
        {
          path: join(folder, "assets", "hello.wav"),
          kind: "audio",
          duration_seconds: 1.5,
        },
      ],
    });
    const spoken = calls.find((call) => call.args.includes("-o"));
    expect(spoken?.args.slice(0, 2)).toEqual(["-v", "Samantha"]);
    expect(spoken?.input).toBe("-Hello from yumekit.");
  });

  it("uses the voice that the call names, at the speed that it gives", async () => {
    const calls: ProgramCall[] = [];

    await speak({
      platform: "darwin",
      calls,
      arguments: { voice: "Daniel", speed: 1.5 },
    });

    const spoken = calls.find((call) => call.args.includes("-o"));
    expect(spoken?.args.slice(0, 4)).toEqual(["-v", "Daniel", "-r", "270"]);
  });

  it("rejects a voice that this computer does not have, and lists the voices", async () => {
    const { result } = await speak({
      platform: "darwin",
      calls: [],
      arguments: { voice: "Albert" },
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "voice must be one of: Samantha, Daniel. It was Albert.",
    );
  });

  it("says how to get a voice on Linux when espeak-ng is not installed", async () => {
    const { result } = await speak({
      platform: "linux",
      calls: [],
      runProgram: noProgram,
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain("Install espeak-ng");
  });

  it("passes the text and the file to Windows through standard input and the environment", async () => {
    const calls: ProgramCall[] = [];
    const runProgram = fakeSay({ calls, seconds: 2 });

    await speak({
      platform: "win32",
      calls,
      runProgram: async (call) => {
        if (call.args.some((part) => part.includes("GetInstalledVoices"))) {
          calls.push(call);
          return {
            kind: "finished",
            exitCode: 0,
            output:
              "en-US|Microsoft Zira Desktop\r\nde-DE|Microsoft Hedda Desktop\r\n",
            errorOutput: "",
          };
        }
        const path = call.environment?.["YUMEKIT_VOICE_FILE"] ?? "";
        return runProgram({ ...call, args: ["-o", path] });
      },
    });

    const spoken = calls.find((call) => call.environment !== undefined);
    expect(spoken?.command).toBe("powershell.exe");
    expect(spoken?.input).toBe("-Hello from yumekit.");
    expect(spoken?.environment).toMatchObject({
      YUMEKIT_VOICE: "Microsoft Zira Desktop",
      YUMEKIT_VOICE_RATE: "0",
    });
  });

  it("refuses a file stem with a path", async () => {
    const { result } = await speak({
      platform: "darwin",
      calls: [],
      arguments: { file_stem: "../escape" },
    });

    expect(result.isError).toBe(true);
  });
});
