import { useEffect, useState } from "react";

const barCount = 64;

function peaksOf(samples: Float32Array): number[] {
  const size = Math.max(1, Math.floor(samples.length / barCount));
  const peaks = Array.from({ length: barCount }, (...[, barIndex]) => {
    let loudest = 0;
    const end = Math.min(samples.length, (barIndex + 1) * size);
    for (let index = barIndex * size; index < end; index += 1) {
      loudest = Math.max(loudest, Math.abs(samples[index] ?? 0));
    }
    return loudest;
  });
  const top = Math.max(...peaks, 0.0001);
  return peaks.map((peak) => peak / top);
}

async function wavePeaksOf(url: string): Promise<number[]> {
  const bytes = await (await fetch(url)).arrayBuffer();
  const context = new OfflineAudioContext(1, 1, 8000);
  const decoded = await context.decodeAudioData(bytes);
  return peaksOf(decoded.getChannelData(0));
}

export function Wave(props: { url: string | undefined; played: number }) {
  const [peaks, setPeaks] = useState<number[]>([]);
  const { url } = props;

  useEffect(() => {
    if (url === undefined) return;
    let isCurrent = true;
    wavePeaksOf(url)
      .then((loaded) => {
        if (isCurrent) setPeaks(loaded);
      })
      .catch(() => {
        if (isCurrent) setPeaks([]);
      });
    return () => {
      isCurrent = false;
    };
  }, [url]);

  return (
    <span className="wave" aria-hidden="true">
      {peaks.map((...[peak, index]) => (
        <i
          key={index}
          data-played={index / barCount < props.played}
          style={{ height: `${String(12 + Math.round(peak * 88))}%` }}
        />
      ))}
    </span>
  );
}
