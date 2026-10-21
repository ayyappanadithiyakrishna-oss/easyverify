/**
 * Pure geometry for the on-device face comparison.
 * Detection decoding follows OpenCV Zoo's YuNet reference (MIT); alignment
 * landmarks and the cosine threshold follow OpenCV Zoo's SFace reference
 * (Apache-2.0). No network, DOM or model access happens here.
 */

export type RgbaImage = {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
};

export type Point = [number, number];

export type Detection = {
  score: number;
  /** x, y, width, height in source-image pixels */
  box: [number, number, number, number];
  /** right eye, left eye, nose, right mouth corner, left mouth corner */
  landmarks: [Point, Point, Point, Point, Point];
};

export const YUNET_SIZE = 640;
const STRIDES = [8, 16, 32] as const;

/** ArcFace-style 112x112 template used by SFace. */
export const ALIGN_TEMPLATE: [Point, Point, Point, Point, Point] = [
  [38.2946, 51.6963],
  [73.5318, 51.5014],
  [56.0252, 71.7366],
  [41.5493, 92.3655],
  [70.7299, 92.2041],
];

/** SFace's published cosine-similarity threshold for "same person". */
export const SFACE_COSINE_THRESHOLD = 0.363;

type YunetOutputs = Record<string, Float32Array>;

export function decodeYunet(
  out: YunetOutputs,
  scale: number,
  minScore = 0.6,
): Detection[] {
  const found: Detection[] = [];
  for (const stride of STRIDES) {
    const cls = out[`cls_${stride}`];
    const obj = out[`obj_${stride}`];
    const bbox = out[`bbox_${stride}`];
    const kps = out[`kps_${stride}`];
    const cols = YUNET_SIZE / stride;
    for (let i = 0; i < cols * cols; i++) {
      const c = Math.min(Math.max(cls[i], 0), 1);
      const o = Math.min(Math.max(obj[i], 0), 1);
      const score = Math.sqrt(c * o);
      if (score < minScore) continue;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = (col + bbox[i * 4]) * stride;
      const cy = (row + bbox[i * 4 + 1]) * stride;
      const w = Math.exp(bbox[i * 4 + 2]) * stride;
      const h = Math.exp(bbox[i * 4 + 3]) * stride;
      const landmarks = [0, 1, 2, 3, 4].map((n): Point => [
        ((kps[i * 10 + n * 2] + col) * stride) / scale,
        ((kps[i * 10 + n * 2 + 1] + row) * stride) / scale,
      ]) as Detection["landmarks"];
      found.push({
        score,
        box: [(cx - w / 2) / scale, (cy - h / 2) / scale, w / scale, h / scale],
        landmarks,
      });
    }
  }
  return nms(found, 0.3);
}

export function iou(a: Detection["box"], b: Detection["box"]): number {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[0] + a[2], b[0] + b[2]);
  const y2 = Math.min(a[1] + a[3], b[1] + b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a[2] * a[3] + b[2] * b[3] - inter;
  return union > 0 ? inter / union : 0;
}

export function nms(list: Detection[], threshold: number): Detection[] {
  const sorted = [...list].sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];
  for (const d of sorted)
    if (kept.every((k) => iou(k.box, d.box) < threshold)) kept.push(d);
  return kept;
}

/** Resize to fit a 640x640 square without distortion; returns CHW BGR floats. */
export function letterboxToTensor(image: RgbaImage): {
  tensor: Float32Array;
  scale: number;
} {
  const scale = YUNET_SIZE / Math.max(image.width, image.height);
  const w = Math.round(image.width * scale);
  const h = Math.round(image.height * scale);
  const plane = YUNET_SIZE * YUNET_SIZE;
  const tensor = new Float32Array(3 * plane);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(image.height - 1, y / scale);
    for (let x = 0; x < w; x++) {
      const sx = Math.min(image.width - 1, x / scale);
      const [r, g, b] = sampleBilinear(image, sx, sy);
      const p = y * YUNET_SIZE + x;
      tensor[p] = b;
      tensor[plane + p] = g;
      tensor[2 * plane + p] = r;
    }
  }
  return { tensor, scale };
}

function sampleBilinear(
  image: RgbaImage,
  x: number,
  y: number,
): [number, number, number] {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, image.width - 1);
  const y1 = Math.min(y0 + 1, image.height - 1);
  const fx = x - x0;
  const fy = y - y0;
  const px = (xx: number, yy: number, c: number) =>
    image.data[(yy * image.width + xx) * 4 + c];
  const out: [number, number, number] = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const top = px(x0, y0, c) * (1 - fx) + px(x1, y0, c) * fx;
    const bottom = px(x0, y1, c) * (1 - fx) + px(x1, y1, c) * fx;
    out[c] = top * (1 - fy) + bottom * fy;
  }
  return out;
}

/** Least-squares similarity transform (Umeyama): src -> dst. */
export function similarityTransform(src: Point[], dst: Point[]) {
  const n = src.length;
  const mean = (pts: Point[]): Point => [
    pts.reduce((s, p) => s + p[0], 0) / n,
    pts.reduce((s, p) => s + p[1], 0) / n,
  ];
  const ms = mean(src);
  const md = mean(dst);
  let a = 0;
  let b = 0;
  let norm = 0;
  for (let i = 0; i < n; i++) {
    const sx = src[i][0] - ms[0];
    const sy = src[i][1] - ms[1];
    const dx = dst[i][0] - md[0];
    const dy = dst[i][1] - md[1];
    a += sx * dx + sy * dy;
    b += sx * dy - sy * dx;
    norm += sx * sx + sy * sy;
  }
  // [x'] = [ p -q ] [x] + t
  // [y']   [ q  p ] [y]
  const p = a / norm;
  const q = b / norm;
  const tx = md[0] - (p * ms[0] - q * ms[1]);
  const ty = md[1] - (q * ms[0] + p * ms[1]);
  return { p, q, tx, ty };
}

/** Warp the face to the 112x112 template; returns CHW BGR floats for SFace. */
export function alignToTensor(
  image: RgbaImage,
  landmarks: Detection["landmarks"],
): Float32Array {
  const { p, q, tx, ty } = similarityTransform(landmarks, ALIGN_TEMPLATE);
  const det = p * p + q * q;
  const size = 112;
  const plane = size * size;
  const tensor = new Float32Array(3 * plane);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // inverse of the similarity transform
      const dx = x - tx;
      const dy = y - ty;
      const sx = (p * dx + q * dy) / det;
      const sy = (-q * dx + p * dy) / det;
      if (sx < 0 || sy < 0 || sx > image.width - 1 || sy > image.height - 1)
        continue;
      const [r, g, b] = sampleBilinear(image, sx, sy);
      const i = y * size + x;
      tensor[i] = b;
      tensor[plane + i] = g;
      tensor[2 * plane + i] = r;
    }
  }
  return tensor;
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d ? dot / d : 0;
}

export function largestFace(faces: Detection[]): Detection | null {
  if (!faces.length) return null;
  return faces.reduce((best, f) =>
    f.box[2] * f.box[3] > best.box[2] * best.box[3] ? f : best,
  );
}
