// Model files and immutable revisions verified against the publisher's API.
export const CHAT_MODELS = {
  fast: {
    name: "Quick start",
    id: "HuggingFaceTB/SmolLM2-135M-Instruct",
    revision: "12fd25f77366fa6b3b4b768ec3050bf629380bac",
    bytes: 137147981,
    gpuBytes: 117691126,
  },
  quality: {
    name: "More capable",
    id: "HuggingFaceTB/SmolLM2-360M-Instruct",
    revision: "a10cc1512eabd3dde888204e902eca88bddb4951",
    bytes: 364564671,
    gpuBytes: 272737275,
  },
} as const;
export type ChatModel = keyof typeof CHAT_MODELS;
