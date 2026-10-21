import { createFaceEngine, type FaceEngine } from "./engine";

const MODELS = {
  detector: "/models/face/face_detection_yunet_2023mar.onnx",
  recognizer: "/models/face/face_recognition_sface_2021dec.onnx",
};

let loading: Promise<FaceEngine> | null = null;

/** Loads YuNet + SFace once, using the WASM runtime served from /vendor. */
export function loadFaceEngine(): Promise<FaceEngine> {
  if (!loading)
    loading = (async () => {
      const ort = await import("onnxruntime-web/wasm");
      ort.env.wasm.wasmPaths = "/vendor/onnx/";
      ort.env.wasm.numThreads = Math.min(
        4,
        Math.max(1, (navigator.hardwareConcurrency || 2) - 1),
      );
      ort.env.logLevel = "error";
      const options = {
        executionProviders: ["wasm"],
        logSeverityLevel: 3,
      } as const;
      const [detector, recognizer] = await Promise.all([
        ort.InferenceSession.create(MODELS.detector, options),
        ort.InferenceSession.create(MODELS.recognizer, options),
      ]);
      return createFaceEngine(
        detector as never,
        recognizer as never,
        (data, dims) => new ort.Tensor("float32", data, dims),
      );
    })().catch((error) => {
      loading = null;
      throw error;
    });
  return loading;
}
