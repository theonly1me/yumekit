export const spaceSection = [
  "## Space across a cut",
  "",
  "- Each start and end entry gives where a character is in the place, its side of the screen, and which way it faces. A cut to a new size or angle of the same moment keeps them, and keeps the screen direction.",
  "- A character that is not in the shot before enters on screen, or its entry says where it waited (enters_from). Demons that appear from nowhere are a plan fault.",
  "- Every person and prop gets its own entry. Never join two characters in one text.",
  "",
].join("\n");

export const fightSection = [
  "## Staging a fight for a trailer",
  "",
  "- Start late, inside the action: the first frame already moves. Never open on a walk.",
  "- Fight one or two opponents, not ten. Each one needs its own design, its place, its attack, and its reaction, or the fight reads as waving a sword at the air.",
  "- Each strike names its ONE target, the point of contact, and the reaction of that target. One strike defeats only what it touches, unless the effect visibly reaches each one.",
  "- An effect (water, fire, lightning) starts at its source (the blade edge, the palm) and travels a stated path to the target. An effect that starts on the ground or at a random place is a fault.",
  "- Cut on the strike. Go close on the eyes and on the blade. Use a low angle for power. Let the cut carry the speed: each clip holds ONE action, and the next shot starts at the contact.",
  "- Vary the size and the angle from shot to shot: wide to set the space, then close, over the shoulder, low. A row of centered wide shots of a man who faces the camera reads as slop.",
  "- A villain reads as a threat by scale against the hero, by stillness, and by what he does to the space around him. Write it in his facts, and his sheet critic checks it.",
  "",
].join("\n");

export const musicSection = [
  "## Writing a music prompt",
  "",
  "- Give each shot a music_intensity (1 quiet to 5 the peak) and its hits (the second of each strike and each cut). set_story_plan returns the cue sheet in film seconds.",
  '- Write the prompt from the cue sheet: the genre and the mood, the instruments by name, the key and the mode (a minor key for menace), the tempo in beats each minute, then the structure by seconds: [0:00 - 0:06] how it starts, where it rises, the hits with their times, silence just before the biggest hit, where it peaks, and how it ends under the end card. End with "Instrumental only, no vocals."',
  "- Start sparse and low, and add one layer in each section. The music starts normal and grows with the fight. Its loudest part is the peak of the fight, never the end card.",
  "- Taste cannot be measured: when a song is cheap, make two or three candidates, check_music each, and place the best fit with its start_seconds. The person picks by ear in the Music view.",
  "",
].join("\n");

export const endCardSection = [
  "## The end card",
  "",
  "- Use the colors of the art direction with set_look colors, and a font that fits the film. Show only the words that the person asked for: no prompt sign, no extra line.",
  "",
].join("\n");
