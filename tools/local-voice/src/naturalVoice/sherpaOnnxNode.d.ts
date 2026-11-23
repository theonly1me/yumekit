declare module "sherpa-onnx-node" {
  interface GeneratedAudio {
    samples: Float32Array;
    sampleRate: number;
  }
  interface GenerationOptions {
    sid: number;
    speed: number;
  }
  interface KokoroFiles {
    model: string;
    voices: string;
    tokens: string;
    lexicon: string;
  }
  interface OfflineTtsConfig {
    model: {
      kokoro: KokoroFiles;
      numThreads: number;
      provider: "cpu";
      debug: boolean;
    };
    maxNumSentences: number;
  }
  interface OfflineTts {
    generateAsync: (request: {
      text: string;
      generationConfig: GenerationOptions;
    }) => Promise<GeneratedAudio>;
  }
  const sherpa: {
    OfflineTts: {
      createAsync: (config: OfflineTtsConfig) => Promise<OfflineTts>;
    };
    GenerationConfig: new (options: GenerationOptions) => GenerationOptions;
  };
  export default sherpa;
}
