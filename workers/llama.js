import { pipeline, env, TextStreamer } from "@huggingface/transformers";
import { CHAT_MODELS } from "../lib/chat-models";
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = self.crossOriginIsolated
  ? Math.min(4, navigator.hardwareConcurrency || 1)
  : 1;
env.backends.onnx.wasm.wasmPaths = "/vendor/onnx/";
let generator = null;
let loadedModel = null;
let busy = false;
self.onmessage = async (event) => {
  const { type, messages, model = "fast" } = event.data;
  if (!CHAT_MODELS[model]) return;
  if (busy) {
    self.postMessage({
      type: "error",
      message: "Another request is still running. Please wait or stop it.",
    });
    return;
  }
  busy = true;
  const started = performance.now();
  try {
    if (!generator || loadedModel !== model) {
      await generator?.dispose();
      generator = null;
      loadedModel = null;
      const choice = CHAT_MODELS[model];
      let device = "wasm";
      let dtype = "q8";
      // The smaller half-precision files require a compatible GPU. CPU mode
      // keeps the tested q8 path rather than downloading unsupported weights.
      try {
        const adapter = await navigator.gpu?.requestAdapter();
        if (adapter?.features.has("shader-f16")) {
          device = "webgpu";
          dtype = "q4f16";
        }
      } catch {
        /* CPU remains available when GPU access is denied. */
      }
      self.postMessage({
        type: "status",
        text: "Checking saved model files, then downloading only what is missing…",
      });
      const progress = (event) => {
        if (event.status === "progress")
          self.postMessage({
            type: "progress",
            file: event.file,
            loaded: event.loaded || 0,
            total: event.total || 0,
            progress: event.progress || 0,
          });
        if (event.status === "done" && event.file?.endsWith(".onnx"))
          self.postMessage({
            type: "status",
            text: "Model files ready. Preparing local chat…",
          });
      };
      try {
        generator = await pipeline("text-generation", choice.id, {
          revision: choice.revision,
          dtype,
          device,
          progress_callback: progress,
        });
      } catch (error) {
        if (device !== "webgpu") throw error;
        self.postMessage({
          type: "status",
          text: "GPU setup was unavailable. Loading the compatible CPU model instead…",
        });
        generator = await pipeline("text-generation", choice.id, {
          revision: choice.revision,
          dtype: "q8",
          device: "wasm",
          progress_callback: progress,
        });
        device = "wasm";
      }
      loadedModel = model;
      self.postMessage({
        type: "ready",
        device,
        seconds: (performance.now() - started) / 1000,
      });
    }
    if (type === "generate") {
      const streamer = new TextStreamer(generator.tokenizer, {
        skip_prompt: true,
        callback_function: (text) => self.postMessage({ type: "chunk", text }),
      });
      const output = await generator(messages, {
        streamer,
        max_new_tokens: 256,
        do_sample: false,
        return_full_text: false,
        repetition_penalty: 1.12,
      });
      const generated = output[0].generated_text;
      const answer =
        typeof generated === "string" ? generated : generated.at(-1)?.content;
      if (!answer?.trim())
        throw new Error(
          "The model returned no answer. Try a shorter question.",
        );
      self.postMessage({
        type: "answer",
        answer: answer.slice(0, 6000),
        seconds: (performance.now() - started) / 1000,
      });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error.message || "Could not run local chat on this device.",
    });
  } finally {
    busy = false;
  }
};
