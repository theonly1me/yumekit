import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cutAudio, probeMedia } from "../index.js";
import { temporaryFolder } from "../testing/renderProject.js";
import { toneWav } from "../testing/toneWav.js";

async function lengthOf(file: string): Promise<number | undefined> {
  const probed = await probeMedia({ file });
  return probed.ok ? probed.value.durationSeconds : undefined;
}

describe("cutAudio", () => {
  it("writes the part of a sound file as a WAV file of that length", async () => {
    const folder = await temporaryFolder();
    const file = join(folder, "voice.wav");
    await writeFile(file, toneWav({ seconds: 3, frequencyHertz: 440 }));

    const cut = await cutAudio({
      file,
      startSeconds: 1,
      durationSeconds: 1.5,
      leadSeconds: 0,
      target: join(folder, "part", "voice-part.wav"),
    });

    expect(cut).toEqual({
      ok: true,
      value: { file: join(folder, "part", "voice-part.wav") },
    });
    expect(await lengthOf(join(folder, "part", "voice-part.wav"))).toBeCloseTo(
      1.5,
      2,
    );
  });

  it("puts silence of the lead length before the part", async () => {
    const folder = await temporaryFolder();
    const file = join(folder, "voice.wav");
    await writeFile(file, toneWav({ seconds: 2, frequencyHertz: 440 }));

    await cutAudio({
      file,
      startSeconds: 0,
      durationSeconds: 1,
      leadSeconds: 0.5,
      target: join(folder, "led.wav"),
    });

    expect(await lengthOf(join(folder, "led.wav"))).toBeCloseTo(1.5, 2);
  });

  it("fails with encode-failed for a file with no sound", async () => {
    const folder = await temporaryFolder();
    const file = join(folder, "notes.wav");
    await writeFile(file, "not a sound");

    const cut = await cutAudio({
      file,
      startSeconds: 0,
      durationSeconds: 1,
      leadSeconds: 0,
      target: join(folder, "out.wav"),
    });

    expect(cut).toMatchObject({
      ok: false,
      failure: { kind: "encode-failed" },
    });
  });
});
