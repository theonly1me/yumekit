export const platforms = [
  { id: "youtube", name: "YouTube", shape: "16:9", width: 1920, height: 1080 },
  {
    id: "shorts",
    name: "YouTube Shorts",
    shape: "9:16",
    width: 1080,
    height: 1920,
  },
  { id: "tiktok", name: "TikTok", shape: "9:16", width: 1080, height: 1920 },
  {
    id: "reel",
    name: "Instagram Reel",
    shape: "9:16",
    width: 1080,
    height: 1920,
  },
  {
    id: "instagram-post",
    name: "Instagram post",
    shape: "4:5",
    width: 1080,
    height: 1350,
  },
  { id: "x", name: "X", shape: "16:9", width: 1920, height: 1080 },
  {
    id: "linkedin",
    name: "LinkedIn",
    shape: "16:9",
    width: 1920,
    height: 1080,
  },
  { id: "square", name: "Square", shape: "1:1", width: 1080, height: 1080 },
  {
    id: "custom",
    name: "Custom size",
    shape: "3:2",
    width: 1500,
    height: 1000,
  },
];

export const lengths = [
  "15 seconds",
  "30 seconds",
  "60 seconds",
  "3 minutes",
  "8 minutes",
  "Let the AI decide",
];

export const tones = {
  paper: "linear-gradient(150deg, #f3f0e9 0%, #ddd6c6 100%)",
  dusk: "linear-gradient(160deg, #c9a56a 0%, #6d5a48 46%, #1c1a1d 100%)",
  ocean: "linear-gradient(170deg, #9fc0c9 0%, #3f6f85 48%, #10212c 100%)",
  ink: "linear-gradient(150deg, #26252a 0%, #0f0f11 100%)",
  moss: "linear-gradient(160deg, #cfd6b8 0%, #6f7f55 52%, #1c2217 100%)",
};

export const firstScenes = [
  {
    id: "s1",
    title: "Opening title",
    text: "Your idea can be a video today",
    other: "From idea to video in one afternoon",
    seconds: 3,
    tone: "paper",
    isVideo: false,
  },
  {
    id: "s2",
    title: "What you bring",
    text: "Bring an idea and the AI plan you pay for",
    other: "You bring the idea. Your AI does the work",
    seconds: 4,
    tone: "ink",
    isVideo: false,
  },
  {
    id: "s3",
    title: "Ocean clip",
    text: "Real video, made on request",
    other: "Ask for a shot. Get the shot",
    seconds: 4,
    tone: "ocean",
    isVideo: true,
  },
  {
    id: "s4",
    title: "Cost chart",
    text: "You pay only for what you make",
    other: "No subscription. Pay for each clip",
    seconds: 4,
    tone: "paper",
    isVideo: false,
  },
  {
    id: "s5",
    title: "Closing line",
    text: "Open source. Runs on your computer",
    other: "Free, open, and yours",
    seconds: 3,
    tone: "dusk",
    isVideo: false,
  },
];

export const makingSteps = [
  { id: "script", label: "Write the script", done: "The script has 5 scenes" },
  { id: "pictures", label: "Make the pictures", done: "5 pictures are ready" },
  { id: "voice", label: "Record the voice", done: "The voice is 18 seconds" },
  { id: "music", label: "Choose the music", done: "Soft piano" },
  { id: "together", label: "Put it together", done: "The video is ready" },
];

export const voices = ["Warm narrator", "Bright and quick", "Calm and low"];
export const musicChoices = [
  "Soft piano",
  "Light electronic",
  "Acoustic guitar",
];
export const captionStyles = ["Word by word", "Full line", "Large and bold"];

export const suggestions = [
  "Make the fog thicker",
  "Give Pell a red scarf",
  "Make chapter 2 shorter",
  "Change the music",
];

export const recentProjects = [
  {
    name: "The Ninth Bell",
    facts: "YouTube, 8 minutes in 4 chapters, changed today",
  },
  {
    name: "What is yumekit",
    facts: "YouTube and TikTok, 18 seconds, changed 2 days ago",
  },
  {
    name: "Street basketball teaser",
    facts: "Instagram Reel, 12 seconds, changed yesterday",
  },
  {
    name: "Launch day thread video",
    facts: "X, 30 seconds, changed 4 days ago",
  },
];

export function platformOf(platformId) {
  return platforms.find((platform) => platform.id === platformId);
}

export function fileNameOf(platformId) {
  return `what-is-yumekit-${platformId}.mp4`;
}
