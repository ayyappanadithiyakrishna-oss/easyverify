import { Header } from "@/components/brand";
import { FaceLab } from "@/components/face-lab";
export default function IdentityCheck() {
  return (
    <>
      <Header />
      <main id="main" className="document-main">
        <h1>Face comparison, on your device.</h1>
        <p className="hero-description">
          An optional biometric experiment. Compare two consented photos without
          sending them to a server.
        </p>
        <FaceLab />
        <h2>What this can tell you</h2>
        <p>
          A face model estimates the similarity of two image descriptors. It
          cannot verify identity, authenticate a person, establish work
          authorization, or replace the official Form I-9 process. Results never
          mark an onboarding requirement complete.
        </p>
        <p>
          Use your own photos or consented test images. Do not use passports,
          driver’s licenses, employee files, or photos collected without
          permission. Clear the page when finished.
        </p>
        <p className="small">
          Model: Human 3.3.6 with BlazeFace, FaceMesh, and HSE FaceRes. No
          results, photos, or face descriptors are persisted.{" "}
          <a href="https://github.com/vladmandic/human/wiki/Models">
            Model credits and limitations
          </a>
          .
        </p>
      </main>
    </>
  );
}
