import { pipeline, env, TextStreamer } from "@huggingface/transformers";
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = self.crossOriginIsolated
  ? Math.min(4, navigator.hardwareConcurrency || 1)
  : 1;
env.backends.onnx.wasm.wasmPaths = "/vendor/onnx/";
let generator = null;
let busy = false;
self.onmessage = async (event) => {
  const { type, messages } = event.data;
  if (busy) return;
  busy = true;
  try {
    if (!generator) {
      self.postMessage({
        type: "status",
        text: "Downloading Llama 3.2 to this browser…",
      });
      generator = await pipeline(
        "text-generation",
        "onnx-community/Llama-3.2-1B-Instruct-ONNX",
        {
          revision: "14007543b6dc92de88daf96a9aa85d2f95ace6ef",
          dtype: "q8",
          device: "wasm",
          progress_callback: (progress) => {
            if (progress.status === "done" && progress.file?.endsWith(".onnx"))
              self.postMessage({
                type: "status",
                text: "Initializing Llama on this device. First startup can take a minute…",
              });
            if (progress.status === "progress")
              self.postMessage({
                type: "status",
                text: `Loading ${progress.file}: ${Math.round(progress.progress || 0)}%`,
              });
          },
        },
      );
      self.postMessage({ type: "ready" });
    }
    if (type === "generate") {
      const streamer = new TextStreamer(generator.tokenizer, {
        skip_prompt: true,
        callback_function: (text) => self.postMessage({ type: "chunk", text }),
      });
      const output = await generator(messages, {
        streamer,
        max_new_tokens: 80,
        do_sample: false,
        return_full_text: false,
        repetition_penalty: 1.1,
      });
      const generated = output[0].generated_text;
      const answer =
        typeof generated === "string" ? generated : generated.at(-1)?.content;
      if (!answer?.trim()) throw new Error("The model returned no answer.");
      self.postMessage({ type: "answer", answer: answer.slice(0, 4000) });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error.message || "Could not run Llama on this device.",
    });
  } finally {
    busy = false;
  }
};
