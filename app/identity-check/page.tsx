import { Header } from "@/components/brand";
import { FaceLab } from "@/components/face-lab";
export default function IdentityCheck() {
  return (
    <>
      <Header />
      <main id="main" className="document-main">
        <h1>Face comparison, on your device.</h1>
        <p className="hero-description">
          An optional experiment. Compare two consented photos without sending
          them to a server.
        </p>
        <FaceLab />
        <h2>What this can tell you</h2>
        <p>
          A face model measures how similar two faces look. It cannot verify
          identity, authenticate a person, establish work authorization, or
          replace the official Form I-9 process. Results never mark an
          onboarding requirement complete.
        </p>
        <p>
          Use your own photos or consented test images. Do not use passports,
          driver’s licenses, employee files, or photos collected without
          permission. Clear the page when finished.
        </p>
        <h2>How it works</h2>
        <p>
          Two open models run in your browser. YuNet finds the face and its
          five landmarks. SFace turns the aligned face into 128 numbers, and
          the page compares those numbers with cosine similarity. On the 1,000
          standard Labeled Faces in the Wild test pairs, OpenCV&apos;s reference
          pipeline is right about 98.7% of the time, with no different-person
          pair accepted. Our JavaScript port matched it on a 300-pair sample
          (98.3%). Those photos skew toward well-lit, public-figure portraits,
          so accuracy on your photos can be lower.
        </p>
        <p className="small">
          Models:{" "}
          <a href="https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet">
            YuNet
          </a>{" "}
          (MIT, from{" "}
          <a href="https://github.com/ShiqiYu/libfacedetection">
            libfacedetection
          </a>
          ) and{" "}
          <a href="https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface">
            SFace
          </a>{" "}
          (Apache-2.0, from the{" "}
          <a href="https://github.com/zhongyy/SFace">SFace research code</a>
          ), distributed through the{" "}
          <a href="https://github.com/opencv/opencv_zoo">OpenCV Zoo</a>. No
          photos, results, or face data are saved.
        </p>
      </main>
    </>
  );
}
