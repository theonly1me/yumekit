export interface KnownLimit {
  id: string;
  limit: string;
  form: string;
  evidence: string;
}

export const knownLimits: KnownLimit[] = [
  {
    id: "two-hands-on-a-prop",
    limit:
      "Two hands on one prop, close up: fingers merge, a hand mirrors, or the arms cross in a way no body can.",
    form: "Show one hand from one clear side angle, large in the frame, and describe each finger and the thumb. Keep the second hand out of the frame.",
    evidence:
      "Third film: 8 hands pictures of the hero; hero-hands-3 is mirrored with impossible arms, and 5 of 6 hero sheet reviews failed on the hands.",
  },
  {
    id: "crowd",
    limit:
      "A crowd, or more than two opponents in one shot: the figures stand still, fuse, or look the same.",
    form: "One or two opponents, each its own cast entry with its own design, place, attack, and reaction.",
    evidence:
      "Second film: the ring of eight demons stood frozen, and the owner asked why all demons look the same.",
  },
  {
    id: "view-change",
    limit:
      "A spin, an orbit, or any move where the view of the camera would change: the place melts into another view.",
    form: "One camera, one view for the clip. Cut to a new angle as a new shot.",
    evidence:
      "Second film: the overhead view turned into an eye level view with no cut.",
  },
  {
    id: "effect-without-source",
    limit:
      "An effect with no named source appears on the ground or at a random place.",
    form: "Name the source (the blade edge, the palm), the path, and the target of each effect, in time order.",
    evidence:
      "Second film: the wave came from the ground, not from the sword. Third film: water appeared from dry dirt in shot 1.",
  },
  {
    id: "exact-scale",
    limit:
      "An exact scale between two characters as a number: the model cannot match a ratio, and the critic measures pixels.",
    form: "A visual comparison: 'side by side, the top of the hero's head reaches the lord's shoulder'. Show both in one picture.",
    evidence:
      "Third film: 18 of 35 failed sheet reviews named a height or a width; the demon lord failed on it in 6 of 7 reviews.",
  },
  {
    id: "small-contact-target",
    limit:
      "A contact that must land on a small target (a foot in a puddle, a blade on a small mark): the model misses it.",
    form: "Frame it so the target fills a large part of the frame, and make the contact the only motion of the clip.",
    evidence:
      "Third film, shot 1: the sandal landed on dry dirt between the puddles, and the splash came from the dirt.",
  },
  {
    id: "long-thin-fingers",
    limit: "Long thin fingers and claws: they tangle, merge, or grow in count.",
    form: "Short blunt claws, hands open and apart from the body and the clothes, or the hands out of the frame.",
    evidence:
      "Third film: the roof crawler failed 7 reviews in 11 pictures, most on its tangled clawed hands and a six limbed crawl.",
  },
  {
    id: "legible-writing",
    limit: "Legible writing: the models draw fake letters.",
    form: "Blank surfaces, or the exact words in quotes with their place for a model that writes text.",
    evidence:
      "First film: signs with fake letters. Third film: the wall sheet had labels.",
  },
  {
    id: "mid-clip-entrance",
    limit:
      "A character that enters in the middle of a clip: it appears from nothing, or its design changes.",
    form: "Start the clip with each character in the frame, or start a new shot at the entrance.",
    evidence: "Second film: more demons came, and the owner asked from where.",
  },
  {
    id: "literal-simile",
    limit: "A simile in a picture prompt: the model draws the compared thing.",
    form: "Describe the shape itself: 'a smooth round boulder head', not 'a head like an old stone lantern'.",
    evidence:
      "Third film: 'a rounded weathered head like an old stone lantern' gave the wall demon the knob of a stone lantern.",
  },
  {
    id: "undescribed-edge",
    limit:
      "A part of a body at the edge of the frame that no prompt describes: it becomes a lump.",
    form: "Describe every visible hand, foot, and garment of the frame, or frame it out.",
    evidence:
      "Third film, shot 1: an undescribed right fist at the top of the start picture became a 'lumpy mitten'.",
  },
];

export function knownLimitLinesOf(
  learned: { text: string; cause: string }[],
): string[] {
  return [
    ...knownLimits.map(
      (limit) =>
        `- ${limit.id}: ${limit.limit} What works: ${limit.form} Evidence: ${limit.evidence}`,
    ),
    ...learned.map(
      (lesson) =>
        `- learned in this film: ${lesson.cause} What works: ${lesson.text}`,
    ),
  ];
}
