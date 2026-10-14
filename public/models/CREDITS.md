# Face-model assets

Copied unchanged from @vladmandic/human 3.3.6 models: BlazeFace (Google MediaPipe), FaceMesh (Google MediaPipe), FaceRes (HSE-asavchenko/HSE_FaceRec_tf). Human browser bundle uses MIT; Google MediaPipe and HSE source repositories use Apache-2.0. License notices accompany these assets.

Model credit ledger: https://github.com/vladmandic/human/wiki/Models
FaceRes source: https://github.com/av-savchenko/HSE_FaceRec_tf
MediaPipe source: https://github.com/google-ai-edge/mediapipe

Library modifications and quantization are described by Human's model ledger. Training-data bias remains present. EasyVerify does not claim independent model validation or production identity-verification accuracy.

Vendor WASM files come from @tensorflow/tfjs-backend-wasm 4.22.0 (Apache-2.0), matching Human's bundled TFJS version. They are served locally, not fetched from an external CDN during image processing.
