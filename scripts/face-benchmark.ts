/**
 * Accuracy check for the on-device face pipeline.
 * usage: tsx scripts/face-benchmark.ts <yunet.onnx> <sface.onnx> <pairs.rgba> <labels.json> [size=250]
 * pairs.rgba holds 2 RGBA images per pair back to back; labels.json is [1|0,...]
 */
import fs from "node:fs";
import * as ort from "onnxruntime-web";
import { createFaceEngine } from "../lib/face/engine";
import {
  cosine,
  largestFace,
  SFACE_COSINE_THRESHOLD,
} from "../lib/face/geometry";

const [yunet, sface, pairsFile, labelsFile, sizeArg] = process.argv.slice(2);
const size = Number(sizeArg ?? 250);
ort.env.wasm.numThreads = 1;
const opts = { executionProviders: ["wasm"] } as const;
const engine = createFaceEngine(
  (await ort.InferenceSession.create(yunet, opts)) as never,
  (await ort.InferenceSession.create(sface, opts)) as never,
  (data, dims) => new ort.Tensor("float32", data, dims),
);
const raw = fs.readFileSync(pairsFile);
const labels: number[] = JSON.parse(fs.readFileSync(labelsFile, "utf8"));
const frame = size * size * 4;
const image = (i: number) => ({
  data: new Uint8ClampedArray(raw.subarray(i * frame, (i + 1) * frame)),
  width: size,
  height: size,
});
const scores: number[] = [];
const used: number[] = [];
let missed = 0;
for (let i = 0; i < labels.length; i++) {
  const embs: Float32Array[] = [];
  for (const k of [0, 1]) {
    const img = image(i * 2 + k);
    const face = largestFace(await engine.detect(img));
    if (face) embs.push(await engine.embed(img, face));
  }
  if (embs.length < 2) {
    missed++;
    continue;
  }
  scores.push(cosine(embs[0], embs[1]));
  used.push(labels[i]);
}
const th = SFACE_COSINE_THRESHOLD;
const pred = scores.map((s) => (s >= th ? 1 : 0));
const acc = pred.filter((p, i) => p === used[i]).length / used.length;
const same = used.map((u, i) => (u ? i : -1)).filter((i) => i >= 0);
const diff = used.map((u, i) => (!u ? i : -1)).filter((i) => i >= 0);
const rate = (idx: number[]) =>
  idx.filter((i) => pred[i] === 1).length / (idx.length || 1);
console.log(
  JSON.stringify({
    pairs: used.length,
    missed,
    threshold: th,
    accuracy: +acc.toFixed(4),
    sameAccepted: +rate(same).toFixed(3),
    differentAccepted: +rate(diff).toFixed(3),
  }),
);
