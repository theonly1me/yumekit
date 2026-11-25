import { cast } from "./film.js";
import { leadNoteOf } from "./takeNotes.js";
import { total } from "./takesStore.js";

export const prices = { picture: 0.09, clipSecond: 0.07, music: 0.1 };

const placeNames = {
  harbor: "The harbor",
  tower: "The bell tower",
  fog: "The strait in fog",
  deck: "The ferry deck",
  drift: "Pell's boat",
  snowshore: "The shore of Hollin",
  stair: "The tower stair",
  loft: "The bell loft",
  clear: "The strait, clear",
};

const musicChoices = [
  ["Low strings and a slow drum", "low"],
  ["Solo cello and wind", "cello"],
  ["Bells and a soft choir", "bells"],
];

let nextNumber = 0;

function itemOf(fields) {
  nextNumber += 1;
  const item = {
    verdict: "waiting",
    comments: [],
    replaces: undefined,
    seconds: 0,
    check: { passed: true, text: "Design check passed" },
    ...fields,
    id: `i${nextNumber}`,
  };
  item.note = fields.note ?? leadNoteOf(item);
  return item;
}

function castItems({ chapter, take }) {
  const chapterId = chapter.id;
  return chapter.cast.flatMap(([character, look]) => {
    const person = cast[character];
    const group = `${person.name}, ${person.looks[look].name}`;
    const base = {
      section: "characters",
      kind: "picture",
      group,
      take,
      chapterId,
    };
    return [
      itemOf({
        ...base,
        slot: `${chapter.id}-${character}-${look}-turn`,
        title: "Turnaround: front, side, back",
        picture: { kind: "turnaround", character, look },
        cost: prices.picture,
        check: { passed: true, text: "Sheet review passed" },
      }),
      itemOf({
        ...base,
        slot: `${chapter.id}-${character}-${look}-poses`,
        title: "Poses for the shots",
        picture: { kind: "poses", character, look },
        cost: prices.picture,
      }),
    ];
  });
}

export function pictureItems({ chapter, scenes, take }) {
  const places = chapter.places.map((art) =>
    itemOf({
      section: "places",
      kind: "picture",
      slot: `${chapter.id}-place-${art}`,
      title: placeNames[art],
      picture: { kind: "scene", art },
      cost: prices.picture,
      take,
      chapterId: chapter.id,
    }),
  );
  const props = chapter.props.map((prop) =>
    itemOf({
      section: "props",
      kind: "picture",
      slot: `${chapter.id}-prop-${prop}`,
      title: prop.charAt(0).toUpperCase() + prop.slice(1),
      picture: { kind: "prop", prop },
      cost: prices.picture,
      take,
      chapterId: chapter.id,
    }),
  );
  const shots = scenes.flatMap((scene) =>
    [...scene.shots.entries()].map(([index, title]) =>
      itemOf({
        section: "shots",
        kind: "picture",
        slot: `${scene.id}-${index}`,
        sceneId: scene.id,
        title,
        group: scene.title,
        picture: { kind: "scene", art: scene.art, variant: index },
        cost: prices.picture,
        take,
        chapterId: chapter.id,
      }),
    ),
  );
  return [...castItems({ chapter, take }), ...places, ...props, ...shots];
}

export function clipItems({ shots, take, chapterId }) {
  const clips = shots.map((shot) =>
    itemOf({
      section: "clips",
      kind: "clip",
      slot: `${shot.slot}-clip`,
      sceneId: shot.sceneId,
      title: shot.title,
      group: shot.group,
      picture: shot.picture,
      seconds: 4,
      cost: prices.clipSecond * 4,
      take,
      chapterId,
    }),
  );
  const music = musicChoices.map(([title, sound]) =>
    itemOf({
      section: "music",
      kind: "music",
      slot: `${chapterId}-music-${sound}`,
      title,
      sound,
      seconds: 130,
      cost: prices.music,
      take,
      chapterId,
    }),
  );
  return [...clips, ...music];
}

export function cutItem({ chapter, scenes, take }) {
  const [first] = scenes;
  return itemOf({
    section: "cut",
    kind: "cut",
    slot: `${chapter.id}-cut`,
    title: `${chapter.name}, the cut`,
    picture: { kind: "scene", art: first?.art ?? "fog" },
    seconds: total(scenes.map((scene) => scene.seconds)),
    cost: 0,
    take,
    chapterId: chapter.id,
  });
}

export function replacementOf({ item, take }) {
  const [firstComment] = item.comments;
  return itemOf({
    ...item,
    picture: { ...item.picture, fault: false, mirror: false },
    replaces: item.id,
    verdict: "waiting",
    comments: [],
    check: { passed: true, text: "Design check passed" },
    take,
    note: `Made again from your notes${firstComment === undefined ? "" : `: "${firstComment.text}"`}. ${leadNoteOf({ ...item, replaces: item.id })}`,
  });
}
