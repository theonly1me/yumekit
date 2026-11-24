export const clipListItems = [
  "Story: does the planned action happen and complete? When? Does each end entry hold?",
  "Objects: each object keeps its place, its side, and its count. Count what the facts count. Does anything appear from nothing or leave for no reason?",
  "Bodies: count bodies, heads, arms, hands. Do two bodies fuse, even for a few frames? Does each figure keep its height against the hero and its feet for the whole clip?",
  "Anatomy: each arm joins its own shoulder and ends in the hand of that side, elbows and wrists bend the way a body bends, and no limb passes through another limb or the body.",
  "Hands and grip: five fingers with a natural shape. Does the grip stay in the planned hand? Does a hand pass through the prop?",
  "Motion: do joints bend as a body bends, feet touch the ground, weight and balance hold, cloth and hair follow? Does each motion that the plan asks for happen (a group that rushes must move)?",
  "Contact and cause: does each strike reach its target at the planned point, and does that target react? Does each effect start at its source (the blade, the hand) and travel to the target? An effect on the ground or at a random place is a fault. Does anything fall that nothing touched?",
  "One camera: do the viewpoint, the place, and the background stay one shot? An overhead view that turns into an eye level view with no cut is a fault, not a camera swoop.",
  "The cut: does the first frame match the start picture (the framing, each figure and its size, each object)? Do the screen side and facing of each character match the end of the shot before?",
  "The sheets: face, hair, each garment, the side of each mark, as the facts say.",
  "A living world (wind, cloth, hair, dust move unless the plan asks for stillness) and no writing that a person cannot read.",
] as const;

export function clipListText(): string {
  return clipListItems
    .map((...[item, index]) => `${String(index + 1)}. ${item}`)
    .join("\n");
}
