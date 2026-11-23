export interface VoiceEntry {
  name: string;
  code: string;
  speakerId: number;
  approved: boolean;
}

const approvedCodes = new Set(["af_heart"]);

const duplicateNameAccents: Record<string, string> = {
  ef_dora: "Dora, Spanish",
  pf_dora: "Dora, Portuguese",
  em_alex: "Alex, Spanish",
  pm_alex: "Alex, Portuguese",
  am_santa: "Santa",
  pm_santa: "Santa, Portuguese",
  em_santa: "Santa, Spanish",
  hf_alpha: "Alpha, Hindi",
  jf_alpha: "Alpha, Japanese",
};

export const kokoroVoiceCodes = [
  "af_alloy",
  "af_aoede",
  "af_bella",
  "af_heart",
  "af_jessica",
  "af_kore",
  "af_nicole",
  "af_nova",
  "af_river",
  "af_sarah",
  "af_sky",
  "am_adam",
  "am_echo",
  "am_eric",
  "am_fenrir",
  "am_liam",
  "am_michael",
  "am_onyx",
  "am_puck",
  "am_santa",
  "bf_alice",
  "bf_emma",
  "bf_isabella",
  "bf_lily",
  "bm_daniel",
  "bm_fable",
  "bm_george",
  "bm_lewis",
  "ef_dora",
  "em_alex",
  "ff_siwis",
  "hf_alpha",
  "hf_beta",
  "hm_omega",
  "hm_psi",
  "if_sara",
  "im_nicola",
  "jf_alpha",
  "jf_gongitsune",
  "jf_nezumi",
  "jf_tebukuro",
  "jm_kumo",
  "pf_dora",
  "pm_alex",
  "pm_santa",
  "zf_xiaobei",
  "zf_xiaoni",
  "zf_xiaoxiao",
  "zf_xiaoyi",
  "zm_yunjian",
  "zm_yunxi",
  "zm_yunxia",
  "zm_yunyang",
  "em_santa",
] as const;

function nameOf(code: string): string {
  const given = code.slice(code.indexOf("_") + 1);
  return (
    duplicateNameAccents[code] ??
    `${given.charAt(0).toUpperCase()}${given.slice(1)}`
  );
}

export const kokoroVoices: VoiceEntry[] = kokoroVoiceCodes.map(
  (...[code, speakerId]) => ({
    name: nameOf(code),
    code,
    speakerId,
    approved: approvedCodes.has(code),
  }),
);

export function approvedVoicesOf(voices: VoiceEntry[]): VoiceEntry[] {
  return voices.filter((voice) => voice.approved);
}
