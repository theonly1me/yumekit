const notes = {
  characters: (item) =>
    item.title.startsWith("Turnaround")
      ? "Front, side, and back in one light. The face and the hair match in all three views. Check the coat on the back view: I see the color less well there."
      : "Four poses that the shots of this chapter need. The hands are open and clear. The reach pose has a short left sleeve.",
  places: () =>
    "The place with no people, in the light of the chapter. The horizon is level. The water may look too still for a strait.",
  props: () =>
    "The prop alone on a plain ground, at its real size next to a hand. The rim is clear. The metal may read as brass, not bronze.",
  shots: (item) =>
    `The start picture of "${item.title}". The faces match their turnarounds. Check where each hand holds the rope or the wheel.`,
  clips: (item) =>
    `Four seconds from the approved picture of "${item.title}". The start frame matches the picture. The motion of the water may loop.`,
  music: () =>
    "Two minutes and ten seconds at 72 beats a minute. It swells at 1:12, where the fog wall comes in.",
  cut: () =>
    "The chapter with its clips, the music, and the words on screen. Each clip starts on a beat.",
};

const checks = {
  clips:
    "Check the hands on the rope from 2.0 to 3.0 seconds. I cannot watch motion, so your eyes decide.",
  music:
    "Listen for the swell at 1:12 and the end on a held note. I cannot hear sound, so your ears decide.",
  cut: "Watch it once at full speed. Check that each cut lands on the music.",
};

export function leadNoteOf(item) {
  return notes[item.section](item);
}

export function whatToCheckOf(item) {
  return checks[item.section];
}

export const seededNotes = {
  turnPell:
    "Front, side, and back. I see a fault: the coat on the back view is olive, and the front is green. I kept it so you can judge it.",
  ropeShot:
    "Pell catches the rope. I see a fault: the rope is in his left hand. His sheet says right. Decline it and I will make it again.",
  fogPlace:
    "The fog stands on the water like a wall. The far edge is soft. It may look thin on a phone screen.",
};
