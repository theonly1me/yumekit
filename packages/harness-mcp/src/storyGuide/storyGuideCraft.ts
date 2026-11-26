export const spaceSection = [
  "## Space across a cut",
  "",
  "- Each start and end entry gives where a character is in the place, its side of the screen, and which way it faces. A cut to a new size or angle of the same moment keeps them, and keeps the screen direction.",
  "- A character that is not in the shot before enters on screen, or its entry says where it waited (enters_from). Inside one moment, a character who changes place moves on screen, or a shot shows the way. In an earlier trailer an enemy stood on a roof, and in the next shot next to the hero with nothing between: the viewer reads that as a mistake, not as speed. Between two moments of a trailer time passes, so a new place needs no link.",
  "- Every person and prop gets its own entry. Never join two characters in one text.",
  "",
].join("\n");

export const fightSection = [
  "## Staging a fight for a trailer",
  "",
  "- Start late, inside the action: the first frame already moves. Never open on a walk.",
  "- A fight needs stakes: the enemies fight back, the hero is in danger, and he does not win each fight with one strike. An enemy that stands still while the hero strikes shows no danger, so nothing is at stake.",
  "- Each opponent on screen needs its own design, its place, its attack, and its reaction, or the fight reads as waving a sword at the air. One or two opponents are easy to stage. A fight against many works as a run of short shots, each with one strike and one reaction.",
  "- Each strike names its ONE target, the point of contact, and the reaction of that target. One strike defeats only what it touches, unless the effect visibly reaches each one.",
  "- An effect (water, fire, lightning) starts at its source (the blade edge, the palm) and travels a stated path to the target. An effect that starts on the ground or at a random place is a fault.",
  "- Cut on the strike. Go close on the eyes and on the blade. Use a low angle for power. Let the cut carry the speed: each clip holds ONE action, and the next shot starts at the contact.",
  "- Start a fight wide, then go close: the wide shot shows who stands where, so each close strike reads. Then vary the size and the angle: close, over the shoulder, low. A row of centered wide shots of a man who faces the camera reads as slop.",
  "- A villain reads as a threat by scale against the hero, by stillness, and by what he does to the space around him. Write it in his facts, and his sheet critic checks it.",
  "",
].join("\n");

export const musicSection = [
  "## Writing a music prompt",
  "",
  "- Give each shot a music_intensity (1 quiet to 5 the peak) and its hits (the second of each strike and each cut). set_story_plan returns the cue sheet in film seconds.",
  '- Write the prompt from the cue sheet: the genre and the mood, the instruments by name, the key and the mode (a minor key for menace), the tempo in beats each minute, then the structure by seconds: [0:00 - 0:06] how it starts, where it rises, the hits with their times, silence just before the biggest hit, where it peaks, and how it ends under the end card. End with "Instrumental only, no vocals."',
  "- Start sparse and low, and add one layer in each section. The music starts normal and grows with the fight. Its loudest part is the peak of the fight, never the end card.",
  "- Taste cannot be measured: when a song is cheap, make two or three candidates, check_music each, and put them in the take of the clips with a note on how each differs. The person picks by ear and drops the others.",
  "- The music comes before the cut, because the cut follows the music: set_tempo with the tempo of the chosen music, cut the shots on its beats, place it with replace_music and its start_seconds, and land the cards on its hits. A cut off the beat feels wrong even when the viewer cannot say why.",
  "",
].join("\n");

export const endCardSection = [
  "## The end card",
  "",
  "- Use the colors of the art direction with set_look colors, and a font that fits the film. Show only the words that the person asked for: no prompt sign, no extra line.",
  "- For a trailer, the end card is a trailer-card with variant title: the name of the film on the biggest hit.",
  "",
].join("\n");
