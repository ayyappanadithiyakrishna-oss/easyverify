# Face-model assets

Copied unchanged from @vladmandic/human 3.3.6 models: BlazeFace (Google MediaPipe), FaceMesh (Google MediaPipe), FaceRes (HSE-asavchenko/HSE_FaceRec_tf). Human browser bundle uses MIT; Google MediaPipe and HSE source repositories use Apache-2.0. License notices accompany these assets.

Model credit ledger: https://github.com/vladmandic/human/wiki/Models
FaceRes source: https://github.com/av-savchenko/HSE_FaceRec_tf
MediaPipe source: https://github.com/google-ai-edge/mediapipe

Library modifications and quantization are described by Human's model ledger. Training-data bias remains present. EasyVerify does not claim independent model validation or production identity-verification accuracy.

Vendor WASM files come from @tensorflow/tfjs-backend-wasm 4.22.0 (Apache-2.0), matching Human's bundled TFJS version. They are served locally, not fetched from an external CDN during image processing.

## Embedded local chatbot

Transformers.js 4.3.1 (Apache-2.0), ONNX Runtime Web (MIT), and ONNX Community Llama-3.2-1B-Instruct-ONNX at revision 14007543b6dc92de88daf96a9aa85d2f95ace6ef. Built with Llama. Meta's Llama 3.2 community license applies separately from application code. Model weights are downloaded directly by the visitor from Hugging Face after choosing to load the model; they are not included in the Git repository or Vercel upload. Questions and conversation are processed in a browser worker, not sent to an inference service.

The q4 model download is approximately 1.69 GB. Browser caching depends on available quota. No performance or universal device-compatibility guarantee is made.

Default smaller chat model: HuggingFaceTB/SmolLM2-135M-Instruct, revision 12fd25f77366fa6b3b4b768ec3050bf629380bac, Apache-2.0 according to its official model card. Source: https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct . It is distinct from the optional Meta Llama model.
