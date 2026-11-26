const tones = [
  { pitch: 660, delaySeconds: 0 },
  { pitch: 880, delaySeconds: 0.16 },
];

export function playChime(): void {
  try {
    const sound = new AudioContext();
    for (const tone of tones) {
      const oscillator = sound.createOscillator();
      const volume = sound.createGain();
      const start = sound.currentTime + tone.delaySeconds;
      oscillator.frequency.value = tone.pitch;
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      oscillator.connect(volume).connect(sound.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.55);
    }
  } catch {
    return;
  }
}

function canNotify(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

export function showNotice(text: string): void {
  if (!canNotify()) return;
  try {
    new Notification("yumekit", { body: text });
  } catch {
    return;
  }
}

export function askForNotices(): void {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "default") return;
  Notification.requestPermission().catch(() => undefined);
}

export function titleWithCount(options: {
  base: string;
  count: number;
}): string {
  return options.count === 0
    ? options.base
    : `(${String(options.count)}) ${options.base}`;
}
