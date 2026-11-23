import { describe, expect, it } from "vitest";
import { styleIds } from "./styles/styleList.ts";
import { connectLocalMusic, filePathOf } from "./testing/connectLocalMusic.ts";
import {
  largestStepOf,
  peakOf,
  readWav,
  repeatStrengthOf,
  type WavFacts,
} from "./testing/wavFacts.ts";

const tempo = 128;
const oneFrameSeconds = 1 / 30;
const minusOneDecibel = 10 ** (-1 / 20);

async function musicOf(input: Record<string, unknown>): Promise<WavFacts> {
  const music = await connectLocalMusic({ withWaitingStyles: true });
  return readWav(filePathOf(await music.makeMusic(input)));
}

describe.each(styleIds)("the style %s", (style) => {
  it("makes a stereo WAV file of the asked length within one frame, with a peak under -1 dBFS", async () => {
    const wav = await musicOf({ style, duration_seconds: 7.3, tempo });

    expect(wav.sampleRate).toBe(48000);
    expect(wav.channels).toBe(2);
    expect(Math.abs(wav.left.length / wav.sampleRate - 7.3)).toBeLessThan(
      oneFrameSeconds,
    );
    expect(peakOf(wav)).toBeLessThan(minusOneDecibel);
    expect(peakOf(wav)).toBeGreaterThan(0.25);
  });

  it("starts and ends in silence with no click", async () => {
    const wav = await musicOf({ style, duration_seconds: 6, tempo });
    const tenMilliseconds = 480;
    const end = wav.left.length;

    for (const samples of [wav.left, wav.right]) {
      expect(samples[0]).toBe(0);
      expect(samples[end - 1]).toBe(0);
      expect(
        largestStepOf({ samples, from: 0, to: tenMilliseconds }),
      ).toBeLessThan(0.02);
      expect(
        largestStepOf({ samples, from: end - tenMilliseconds, to: end }),
      ).toBeLessThan(0.002);
    }
  });

  it("repeats its beat at the asked tempo, and not at a tempo 6 percent away", async () => {
    const wav = await musicOf({
      style,
      duration_seconds: 10,
      tempo,
      energy: [0.38, 0.38],
    });
    const beatSeconds = 60 / tempo;
    const strengthAt = (share: number) =>
      repeatStrengthOf({ wav, periodSeconds: beatSeconds * share });

    expect(strengthAt(1)).toBeGreaterThan(1.4 * strengthAt(1.06));
    expect(strengthAt(1)).toBeGreaterThan(1.4 * strengthAt(0.94));
  });

  it("gives the same bytes for the same seed, and other bytes for another seed", async () => {
    const input = { style, duration_seconds: 4, tempo, seed: 7 };

    const first = await musicOf(input);
    const again = await musicOf(input);
    const other = await musicOf({ ...input, seed: 8 });

    expect(first.bytes.equals(again.bytes)).toBe(true);
    expect(first.bytes.equals(other.bytes)).toBe(false);
  });
});
