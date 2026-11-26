import { describe, expect, it } from "vitest";
import { callTool } from "../testing/rawRequest.js";
import { startChatEngine } from "./testing/chatEngine.js";

type ChatEngine = Awaited<ReturnType<typeof startChatEngine>>;

function shotOf(shotId: string) {
  return {
    shot_id: shotId,
    purpose: `Show ${shotId}.`,
    action: `The boat moves in ${shotId}`,
    place_id: "strait",
    cast_ids: [],
    camera_size: "wide",
    camera_angle: "eye-level",
    camera_lens: "normal",
    music_intensity: 2,
    seconds: 2,
    start_state: [],
    end_state: [],
    inherits: "",
    start_picture_prompt: `Shot ${shotId}`,
    video_prompt: `Shot ${shotId}`,
  };
}

function chapter(options: { id: string; title: string; shotIds: string[] }) {
  return {
    chapter_id: options.id,
    title: options.title,
    shot_ids: options.shotIds,
  };
}

const harbor = { id: "harbor", title: "The harbor" };
const fog = { id: "fog", title: "Into the fog" };

async function plannedFilm(): Promise<ChatEngine> {
  const chat = await startChatEngine({ steps: [] });
  const planned = await callTool({
    ...chat.engine,
    name: "set_story_plan",
    input: {
      logline: "A boat crosses the strait.",
      want: "To cross",
      obstacle: "The fog",
      change: "It arrives",
      shots: ["a", "b", "c"].map(shotOf),
      chapters: [
        chapter({ ...harbor, shotIds: ["a", "b"] }),
        chapter({ ...fog, shotIds: ["c"] }),
      ],
    },
  });
  expect(planned.body).toContain('"isError":false');
  return chat;
}

async function summaryAfter(options: {
  chat: ChatEngine;
  chapters: ReturnType<typeof chapter>[];
}): Promise<unknown> {
  await callTool({
    ...options.chat.engine,
    name: "set_chapters",
    input: { chapters: options.chapters },
  });
  return (await options.chat.readChat()).entries.at(-1);
}

describe("a change of the chapters by the person in the chat", () => {
  it.each([
    {
      change: "a new title",
      chapters: [
        chapter({ ...harbor, title: "The old harbor", shotIds: ["a", "b"] }),
        chapter({ ...fog, shotIds: ["c"] }),
      ],
      summary: 'You renamed chapter 1 to "The old harbor".',
    },
    {
      change: "a moved line",
      chapters: [
        chapter({ ...harbor, shotIds: ["a"] }),
        chapter({ ...fog, shotIds: ["b", "c"] }),
      ],
      summary: "You moved the line between chapter 1 and chapter 2.",
    },
    {
      change: "a split",
      chapters: [
        chapter({ ...harbor, shotIds: ["a"] }),
        chapter({ id: "dock", title: "From b", shotIds: ["b"] }),
        chapter({ ...fog, shotIds: ["c"] }),
      ],
      summary: "You split chapter 1.",
    },
    {
      change: "a join",
      chapters: [chapter({ ...harbor, shotIds: ["a", "b", "c"] })],
      summary: "You joined chapter 1 and chapter 2.",
    },
    {
      change: "a moved chapter",
      chapters: [
        chapter({ ...fog, shotIds: ["c"] }),
        chapter({ ...harbor, shotIds: ["a", "b"] }),
      ],
      summary: 'You moved the chapter "Into the fog".',
    },
    {
      change: "a scene in another chapter",
      chapters: [
        chapter({ ...harbor, shotIds: ["b"] }),
        chapter({ ...fog, shotIds: ["c", "a"] }),
      ],
      summary: "You moved a scene to another chapter.",
    },
  ])(
    "says what changed for $change",
    async ({ chapters, summary }) => {
      const chat = await plannedFilm();

      const entry = await summaryAfter({ chat, chapters });

      expect(entry).toMatchObject({ kind: "change", by: "person", summary });
    },
    60_000,
  );
});
