export const filmTitle = "The Ninth Bell";

export const cast = {
  wren: {
    name: "Wren",
    looks: {
      harbor: { name: "harbor look", coat: "#c8902f", hair: "#3a2a20" },
      snow: { name: "winter look", coat: "#8c2f2b", hair: "#3a2a20" },
    },
  },
  odo: {
    name: "Odo",
    looks: { base: { name: "own look", coat: "#6b6f73", hair: "#e8e4dc" } },
  },
  pell: {
    name: "Pell",
    looks: { base: { name: "own look", coat: "#3f6b4f", hair: "#7a4a2a" } },
  },
};

export const firstChapters = [
  {
    id: "c1",
    name: "The last crossing",
    step: "done",
    cast: [
      ["wren", "harbor"],
      ["odo", "base"],
    ],
    places: ["harbor", "tower"],
    props: ["cracked bell"],
  },
  {
    id: "c2",
    name: "Into the fog",
    step: "pictures",
    cast: [
      ["wren", "harbor"],
      ["pell", "base"],
    ],
    places: ["fog", "deck", "drift"],
    props: ["new bell", "ferry lantern"],
  },
  {
    id: "c3",
    name: "Snow on Hollin",
    step: "story",
    cast: [
      ["wren", "snow"],
      ["pell", "base"],
    ],
    places: ["snowshore", "stair"],
    props: ["rope"],
  },
  {
    id: "c4",
    name: "The ninth bell",
    step: "story",
    cast: [
      ["wren", "snow"],
      ["odo", "base"],
    ],
    places: ["loft", "clear"],
    props: ["ninth bell"],
  },
];

function sceneOf(row) {
  const [id, chapterId, title, text, seconds, art, shots] = row.split("|");
  return {
    id,
    chapterId,
    title,
    text,
    other: text,
    seconds: Number(seconds),
    tone: "ink",
    art,
    shots: shots.split(";"),
    isVideo: chapterId === "c1",
  };
}

export const firstFilmScenes = [
  "f1|c1|Harbor at dawn|Three days before the fog|25|harbor|Wide harbor;Wren on the pier",
  "f2|c1|Odo at the tower|The bell ringer is ill|30|tower|Tower door;Odo falls",
  "f3|c1|The cracked bell|Eight bells. One is broken|25|bell|The crack;Wren's hand on the bell",
  "f4|c1|Wren decides|Someone has to go|30|deck|Wren at the wheel;She casts off",
  "f5|c2|Casting off|The last ferry leaves|30|deck|Rope off the post;The harbor falls back",
  "f6|c2|The fog wall|A wall with no door|35|fog|The wall ahead;Wren slows the engine",
  "f7|c2|A voice in the fog|Someone is out here|35|fogvoice|A lantern far off;Wren calls out",
  "f8|c2|Pell's drifting boat|A fisher with no engine|30|drift|The drifting boat;Pell catches the rope;Two boats, one rope",
  "f9|c3|Landing in snow|Hollin, white and silent|35|snowshore|The bow hits sand;Footprints in snow",
  "f10|c3|The iced stair|Two hundred steps of ice|40|stair|The stair from below;Wren's boots slip",
  "f11|c3|The bell slips|Too heavy for one|30|bell|The bell tips;Pell grabs the rope",
  "f12|c3|Pell holds the rope|Together, step by step|35|rope|Both on the rope;The loft door",
  "f13|c4|The ninth bell|She rings it|30|loft|The pull;The first note",
  "f14|c4|The fog lifts|The strait opens|25|clear|Fog thins;Blue water",
  "f15|c4|Boats come home|Every boat finds the harbor|25|boats|Boats in a line",
  "f16|c4|Odo hears it|Nine bells again|20|listen|Odo at the window",
].map(sceneOf);
