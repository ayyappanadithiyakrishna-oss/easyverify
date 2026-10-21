import assert from "node:assert/strict";
import test from "node:test";
import {
  ALIGN_TEMPLATE,
  cosine,
  decodeYunet,
  nms,
  similarityTransform,
  YUNET_SIZE,
  type Detection,
} from "../lib/face/geometry";
import { verdictFor } from "../lib/face/verdict";

test("similarity transform recovers a known scale, rotation and shift", () => {
  const angle = Math.PI / 12;
  const p = 1.5 * Math.cos(angle);
  const q = 1.5 * Math.sin(angle);
  const src = ALIGN_TEMPLATE.map(
    ([x, y]) => [p * x - q * y + 20, q * x + p * y - 7] as [number, number],
  );
  const t = similarityTransform(src, ALIGN_TEMPLATE);
  src.forEach(([x, y], i) => {
    const mx = t.p * x - t.q * y + t.tx;
    const my = t.q * x + t.p * y + t.ty;
    assert.ok(Math.abs(mx - ALIGN_TEMPLATE[i][0]) < 1e-6);
    assert.ok(Math.abs(my - ALIGN_TEMPLATE[i][1]) < 1e-6);
  });
});

test("cosine similarity of identical, orthogonal and opposite vectors", () => {
  assert.equal(cosine([1, 2, 3], [1, 2, 3]).toFixed(6), "1.000000");
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([1, 1], [-1, -1]).toFixed(6), "-1.000000");
  assert.equal(cosine([0, 0], [1, 1]), 0);
});

test("non-max suppression keeps the strongest of overlapping boxes", () => {
  const lm = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]] as Detection["landmarks"];
  const kept = nms(
    [
      { score: 0.7, box: [10, 10, 100, 100], landmarks: lm },
      { score: 0.9, box: [12, 12, 100, 100], landmarks: lm },
      { score: 0.8, box: [400, 400, 50, 50], landmarks: lm },
    ],
    0.3,
  );
  assert.deepEqual(kept.map((d) => d.score), [0.9, 0.8]);
});

test("decoding returns nothing when no cell is confident", () => {
  const out: Record<string, Float32Array> = {};
  for (const s of [8, 16, 32]) {
    const n = (YUNET_SIZE / s) ** 2;
    out[`cls_${s}`] = new Float32Array(n);
    out[`obj_${s}`] = new Float32Array(n);
    out[`bbox_${s}`] = new Float32Array(n * 4);
    out[`kps_${s}`] = new Float32Array(n * 10);
  }
  assert.equal(decodeYunet(out, 1).length, 0);
});

test("decoding maps a confident cell back to source pixels", () => {
  const out: Record<string, Float32Array> = {};
  for (const s of [8, 16, 32]) {
    const n = (YUNET_SIZE / s) ** 2;
    out[`cls_${s}`] = new Float32Array(n);
    out[`obj_${s}`] = new Float32Array(n);
    out[`bbox_${s}`] = new Float32Array(n * 4);
    out[`kps_${s}`] = new Float32Array(n * 10);
  }
  // stride 32, cell (col 5,row 3): box centre (5.5*32, 3.5*32), 64px square
  const cols = YUNET_SIZE / 32;
  const i = 3 * cols + 5;
  out.cls_32[i] = 1;
  out.obj_32[i] = 1;
  out.bbox_32.set([0.5, 0.5, Math.log(2), Math.log(2)], i * 4);
  const [d] = decodeYunet(out, 0.5);
  assert.deepEqual(
    d.box.map((v) => Math.round(v)),
    [(5.5 * 32 - 32) * 2, (3.5 * 32 - 32) * 2, 128, 128],
  );
});

test("verdicts follow the published threshold and never say 'verified'", () => {
  assert.equal(verdictFor(0.66).band, "strong");
  assert.equal(verdictFor(0.4).band, "likely");
  assert.equal(verdictFor(0.3).band, "unclear");
  assert.equal(verdictFor(0.05).band, "different");
  for (const s of [0.7, 0.4, 0.3, 0.05])
    assert.doesNotMatch(JSON.stringify(verdictFor(s)), /verified|authoriz/i);
});
