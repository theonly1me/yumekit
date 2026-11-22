export const scriptAndTwoScenes = [
  { name: "set_script", input: { script: "Tea is calm. Tea is warm." } },
  {
    name: "put_scene",
    input: {
      scene_id: "calm",
      title: "Calm tea",
      kit_component: "title-card",
      props: { heading: "Tea is calm" },
    },
  },
  {
    name: "put_scene",
    input: {
      scene_id: "warm",
      title: "Warm tea",
      kit_component: "title-card",
      props: { heading: "Tea is warm" },
    },
  },
];
