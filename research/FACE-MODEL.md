# Face comparison model

## Why it changed

The first version used Human 3.3.6 (BlazeFace + FaceMesh + a general-purpose "FaceRes" descriptor) and mapped the descriptor distance to a 0-100 score. Two photos of the same person often scored low, because that descriptor was not trained for face verification, and the 0-100 score had no calibration behind it.

## What it uses now

| Stage | Model | License | Source |
|---|---|---|---|
| Detect face + 5 landmarks | YuNet 2023mar | MIT | https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet (training: https://github.com/ShiqiYu/libfacedetection.train) |
| Align to 112x112, embed | SFace 2021dec | Apache-2.0 | https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface (research code: https://github.com/zhongyy/SFace) |
| Run in the browser | ONNX Runtime Web (WASM) | MIT | https://github.com/microsoft/onnxruntime |

The pipeline is in `lib/face/` (pure TypeScript geometry, an engine that takes any ONNX session, and the browser loader). The decision threshold of 0.363 cosine similarity is the one published with SFace in the OpenCV Zoo.

## Measured accuracy

Dataset: Labeled Faces in the Wild, the standard 1,000 test pairs (500 same person, 500 different), loaded with scikit-learn's `fetch_lfw_pairs` (funneled, 250x250).

| Pipeline | Pairs | Accuracy at 0.363 | Same accepted | Different accepted |
|---|---|---|---|---|
| OpenCV reference (Python, `FaceDetectorYN` + `FaceRecognizerSF`) | 1,000 | 98.7% | 97.4% | 0.0% |
| EasyVerify TypeScript port (`scripts/face-benchmark.ts`) | 300 (150/150) | 98.3% | 96.7% | 0.0% |

Mean cosine similarity: same person 0.66, different people 0.08.

Reproduce the port check: export pairs as raw RGBA plus a labels JSON, then
`npx tsx scripts/face-benchmark.ts <yunet.onnx> <sface.onnx> <pairs.rgba> <labels.json>`.

## Limits

- LFW is mostly lighter-skinned public figures in good light. Published face-recognition evaluations consistently find lower accuracy and different error rates across skin tones, ages, and genders. We have not measured those differences, so do not present this as fair or unbiased.
- There is no liveness or spoof check. A photo of a photo can match.
- A similarity score is not identity verification, and EasyVerify never uses it to mark any onboarding step complete.
- No photos, embeddings, or results are stored or sent anywhere.

## "Training" the model

Both models arrive pre-trained by their authors, on large public face datasets. EasyVerify does not train or fine-tune on user photos: that would require collecting biometric data, which this project deliberately avoids. To go further with consented data, YuNet's training repository is https://github.com/ShiqiYu/libfacedetection.train , and SFace's research code (loss function and training scripts) is https://github.com/zhongyy/SFace . Any fine-tuning should use a dataset with explicit consent and a documented demographic evaluation.
