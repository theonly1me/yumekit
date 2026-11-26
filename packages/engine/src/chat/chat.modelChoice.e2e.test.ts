import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { result, whole } from "./testing/claudeLines.js";
import type { FakeStep } from "./testing/chatEngine.js";
import {
  chatWithSwordSheet,
  criticSteps,
  jsonOf,
  saved,
} from "./testing/swordSheet.js";

type SwordChat = Awaited<ReturnType<typeof chatWithSwordSheet>>;

const leadInit = JSON.stringify({
  type: "system",
  subtype: "init",
  session_id: "5f1c-made-up-session",
  model: "claude-sonnet-made-up",
  mcp_servers: [{ name: "yumekit", status: "connected" }],
});

const refusedModelText =
  "There's an issue with the selected model (not-a-model). It may not exist or you may not have access to it. Run --model to pick a different model.";

const refusedModelSteps: FakeStep[] = [
  {
    print: JSON.stringify({
      type: "assistant",
      error: "model_not_found",
      message: { content: [{ type: "text", text: refusedModelText }] },
    }),
  },
  {
    print: JSON.stringify({
      type: "result",
      is_error: true,
      terminal_reason: "api_error",
      result: refusedModelText,
    }),
  },
];

async function chooseModels(options: { chat: SwordChat; models: object }) {
  const { chat } = options;
  await writeFile(
    join(chat.project.configurationDirectory, "settings.json"),
    JSON.stringify({
      agent: "claude-code",
      agentPrograms: {
        "claude-code": join(chat.project.root, "fake-agent", "claude"),
      },
      models: { "claude-code": options.models },
    }),
  );
}

function reviewSteps(folder: string): FakeStep[] {
  return [
    { print: leadInit },
    {
      callTool: {
        name: "review_sheet",
        input: { cast_id: "sword" },
        saveResultTo: saved({ folder, name: "review" }),
      },
    },
    { print: whole("I checked the sword sheet.") },
    { print: result("completed") },
  ];
}

function flagValueOf(options: { flags: string[] | undefined; flag: string }) {
  const flags = options.flags ?? [];
  const index = flags.indexOf(options.flag);
  return index === -1 ? undefined : flags[index + 1];
}

const noticeSchema = z.object({ kind: z.literal("notice"), text: z.string() });

async function noticesOf(chat: SwordChat): Promise<string[]> {
  const { entries } = await chat.readChat();
  return entries.flatMap((entry) => {
    const notice = noticeSchema.safeParse(entry);
    return notice.success ? [notice.data.text] : [];
  });
}

describe("the model and the effort of the lead and the critic", () => {
  it("starts the lead and the critic each with its own choice, and the answer names the model that ran", async () => {
    const chat = await chatWithSwordSheet();
    const folder = chat.project.root;
    await chooseModels({
      chat,
      models: {
        lead: { model: "sonnet", effort: "low" },
        critic: { model: "opus", effort: "high" },
      },
    });
    await chat.writeScenario({
      steps: reviewSteps(folder),
      criticSteps: criticSteps(folder),
    });

    await chat.ask({ text: "Check the sword sheet." });
    const { entries } = await chat.waitUntilIdle();
    const [lead, critic] = await chat.runs();

    expect(flagValueOf({ flags: lead, flag: "--model" })).toBe("sonnet");
    expect(flagValueOf({ flags: lead, flag: "--effort" })).toBe("low");
    expect(flagValueOf({ flags: critic, flag: "--model" })).toBe("opus");
    expect(flagValueOf({ flags: critic, flag: "--effort" })).toBe("high");
    expect(entries.find((entry) => entry.kind === "answer")).toMatchObject({
      madeWith: {
        program: "Claude Code",
        model: "claude-sonnet-made-up",
        effort: "low",
      },
    });
  });

  it("passes no model and no effort when the person chose none", async () => {
    const chat = await chatWithSwordSheet();
    const folder = chat.project.root;
    await chat.writeScenario({
      steps: reviewSteps(folder),
      criticSteps: criticSteps(folder),
    });

    await chat.ask({ text: "Check the sword sheet." });
    await chat.waitUntilIdle();
    const runs = await chat.runs();

    expect(runs).toHaveLength(2);
    for (const flags of runs) {
      expect(flags).not.toContain("--model");
      expect(flags).not.toContain("--effort");
    }
  });

  it("tells the person in plain words that the program refused the model of the lead, and which setting to change", async () => {
    const chat = await chatWithSwordSheet();
    await chooseModels({ chat, models: { lead: { model: "not-a-model" } } });
    await chat.writeScenario({ steps: refusedModelSteps });

    await chat.ask({ text: "Check the sword sheet." });
    await chat.waitUntilIdle();

    expect(await noticesOf(chat)).toEqual([
      `Claude Code refused the model "not-a-model" that Settings chose for "The AI that makes the film". Claude Code said: ${refusedModelText} Open Settings, then AI, and pick another model, or leave the model empty so that Claude Code uses its own.`,
    ]);
  });

  it("tells the person and the lead that the program refused the model of the critic", async () => {
    const chat = await chatWithSwordSheet();
    const folder = chat.project.root;
    await chooseModels({ chat, models: { critic: { model: "not-a-model" } } });
    await chat.writeScenario({
      steps: reviewSteps(folder),
      criticSteps: refusedModelSteps,
    });

    await chat.ask({ text: "Check the sword sheet." });
    await chat.waitUntilIdle();
    const review = await jsonOf(saved({ folder, name: "review" }));
    const refusal = `Claude Code refused the model "not-a-model" that Settings chose for "The AI that checks the work".`;

    const notices = await noticesOf(chat);
    const data = review["data"];

    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain(refusal);
    expect(review["isError"]).toBe(true);
    expect(z.object({ message: z.string() }).parse(data).message).toContain(
      refusal,
    );
  });
});
