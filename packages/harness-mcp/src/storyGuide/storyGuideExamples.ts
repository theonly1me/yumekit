interface WorkedExample {
  fault: string;
  prompt: string;
  why: string;
  corrected: string;
}

export const workedExamples: WorkedExample[] = [
  {
    fault:
      "The door knob is on the left, the door opens from the right, and a new knob appears. A lit bedroom is behind the door.",
    prompt:
      "In a quiet dark bedroom at night, the girl in the yellow raincoat holds up her glowing round paper lantern, then reaches for the half-open door and pulls it open; warm light spills in.",
    why: "No hinge side, no knob side, no space behind the door, and the start picture showed the door half open already. Two actions in 4 seconds, and no hand for the lantern.",
    corrected:
      "A single continuous shot, no scene cuts. The bedroom of the place sheet: the wooden door on the right wall is closed, hinges on its left edge, a brass knob on its right edge; behind it is the dark hallway. [0-1s] she moves the lantern stick to her left hand and reaches for the knob with her right hand. [1-3s] her fingers close around the knob, she turns it and pulls; the door swings toward her on its left hinges and cold blue hallway light falls across the floor. [3-4s] she steps into the gap, the lantern swinging gently in her left hand. The knob stays on the right edge of the door. Rain runs down the window behind her, the curtain moves in a draft.",
  },
  {
    fault: "The fireflies and the fog do not move. Only the girl moves.",
    prompt:
      "Hundreds of tiny golden lights drift around her like fireflies, mist moves between the trunks, light shafts shimmer.",
    why: "A list of things, not motion in time with a cause. A walk, a look up, an orbit, and the lights in 5 seconds.",
    corrected:
      "A single continuous shot, no scene cuts. A slow breeze moves from left to right through the clearing: the ferns bend and spring back, the mist drifts right between the trunks, and the fireflies rise and fall in loose spirals, lit and dark in turn. [0-2s] she kneels and sets the lantern on the moss with her right hand. [2-4s] the fireflies drift toward the warm light and circle it; she opens her hand under them.",
  },
  {
    fault:
      "A kids story turned into a neon city with fake letters on each sign.",
    prompt:
      "A rain-soaked cyberpunk city at night. The girl walks slowly away down the middle of the wet neon-lit street.",
    why: "The place came from the request, not from the story, and the action only walks. Signs with no exact text become fake letters.",
    corrected:
      'Ask what the girl wants. If she looks for her lost cat, the street is her own street at night, and the shot is an action: "[0-2s] she crouches by the gutter and lifts the lantern with her right hand. [2-4s] in its light, two small eyes shine under a parked car; she reaches out her left hand, palm up." Shop signs are blank painted boards, or carry exact text in quotes.',
  },
];

export const exampleSection = [
  "## The faults of the first film, corrected",
  "",
  ...workedExamples.flatMap((...[example, index]) => [
    `### ${String(index + 1)}. ${example.fault}`,
    "",
    `The prompt: "${example.prompt}"`,
    "",
    `Why it failed: ${example.why}`,
    "",
    `Corrected: ${example.corrected}`,
    "",
  ]),
].join("\n");
