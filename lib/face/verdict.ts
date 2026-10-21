import { SFACE_COSINE_THRESHOLD, type Detection } from "./geometry";

export type Band = "strong" | "likely" | "unclear" | "different";

export type Verdict = {
  band: Band;
  title: string;
  detail: string;
};

/**
 * Cosine similarity of SFace embeddings. Measured on LFW (see
 * research/FACE-MODEL.md): same-person pairs average ~0.66, different-person
 * pairs ~0.08, and 0.363 is the model authors' published decision threshold.
 */
export function verdictFor(similarity: number): Verdict {
  if (similarity >= 0.5)
    return {
      band: "strong",
      title: "Strong similarity",
      detail:
        "The two faces are very similar to the model, well above the threshold it was designed around.",
    };
  if (similarity >= SFACE_COSINE_THRESHOLD)
    return {
      band: "likely",
      title: "Likely the same person",
      detail:
        "Above the model's published threshold. Poor lighting or angles can still produce this for look-alikes.",
    };
  if (similarity >= 0.25)
    return {
      band: "unclear",
      title: "Inconclusive",
      detail:
        "Between clearly different and clearly similar. Retake both photos in even light, facing the camera.",
    };
  return {
    band: "different",
    title: "Likely different people",
    detail:
      "Well below the threshold. If these are the same person, check lighting, angle, and image sharpness first.",
  };
}

export type Quality = {
  faceSize: number;
  detectionScore: number;
  tiltDegrees: number;
  extraFaces: number;
  warnings: string[];
};

export function assessQuality(
  faces: Detection[],
  chosen: Detection,
  imageWidth: number,
  imageHeight: number,
  sharpness: number,
): Quality {
  const [re, le] = chosen.landmarks;
  const tilt = Math.abs(
    (Math.atan2(le[1] - re[1], le[0] - re[0]) * 180) / Math.PI,
  );
  const faceSize = Math.round(Math.min(chosen.box[2], chosen.box[3]));
  const extraFaces = faces.filter(
    (f) => f !== chosen && f.box[2] * f.box[3] > chosen.box[2] * chosen.box[3] * 0.4,
  ).length;
  const warnings: string[] = [];
  if (faceSize < 80)
    warnings.push("The face is small. Move closer or use a higher-resolution photo.");
  if (chosen.score < 0.8)
    warnings.push("The face was only weakly detected. Check for glare, masks, or a turned head.");
  if (tilt > 20)
    warnings.push("The head is tilted. Keep the eyes level.");
  if (sharpness < 40)
    warnings.push("The photo looks blurry. Hold still or use better light.");
  if (extraFaces)
    warnings.push("Another face is nearly as large. Only the largest face was compared.");
  if (imageWidth < 200 || imageHeight < 200)
    warnings.push("The photo is very small.");
  return {
    faceSize,
    detectionScore: Math.round(chosen.score * 100),
    tiltDegrees: Math.round(tilt),
    extraFaces,
    warnings,
  };
}

/** Variance of a 4-neighbour Laplacian on luminance; higher means sharper. */
export function sharpnessOf(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  box: [number, number, number, number],
): number {
  const x0 = Math.max(1, Math.floor(box[0]));
  const y0 = Math.max(1, Math.floor(box[1]));
  const x1 = Math.min(width - 2, Math.floor(box[0] + box[2]));
  const y1 = Math.min(height - 2, Math.floor(box[1] + box[3]));
  const lum = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const l =
        lum(x - 1, y) + lum(x + 1, y) + lum(x, y - 1) + lum(x, y + 1) - 4 * lum(x, y);
      sum += l;
      sumSq += l * l;
      n++;
    }
  if (!n) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}
