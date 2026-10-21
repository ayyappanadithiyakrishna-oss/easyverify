import {
  alignToTensor,
  cosine,
  decodeYunet,
  letterboxToTensor,
  YUNET_SIZE,
  type Detection,
  type RgbaImage,
} from "./geometry";

/** The slice of onnxruntime we use, so tests can inject any backend. */
export type TensorLike = { data: Float32Array | Float64Array | unknown };
export type Session = {
  run(feeds: Record<string, unknown>): Promise<Record<string, TensorLike>>;
};
export type TensorFactory = (
  data: Float32Array,
  dims: number[],
) => unknown;

export type FaceEngine = {
  detect(image: RgbaImage): Promise<Detection[]>;
  embed(
    image: RgbaImage,
    face: Detection,
  ): Promise<Float32Array>;
};

export function createFaceEngine(
  detector: Session,
  recognizer: Session,
  tensor: TensorFactory,
): FaceEngine {
  return {
    async detect(image) {
      const { tensor: input, scale } = letterboxToTensor(image);
      const out = await detector.run({
        input: tensor(input, [1, 3, YUNET_SIZE, YUNET_SIZE]),
      });
      const flat: Record<string, Float32Array> = {};
      for (const [name, t] of Object.entries(out))
        flat[name] = t.data as Float32Array;
      return decodeYunet(flat, scale);
    },
    async embed(image, face) {
      const aligned = alignToTensor(image, face.landmarks);
      const out = await recognizer.run({
        data: tensor(aligned, [1, 3, 112, 112]),
      });
      return Float32Array.from(out.fc1.data as Float32Array);
    },
  };
}

export { cosine };
