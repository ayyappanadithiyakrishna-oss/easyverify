"use client";
import "./face-lab.css";
import { useEffect, useRef, useState } from "react";
import { loadFaceEngine } from "@/lib/face/browser";
import { cosine, largestFace } from "@/lib/face/geometry";
import {
  assessQuality,
  sharpnessOf,
  verdictFor,
  type Quality,
  type Verdict,
} from "@/lib/face/verdict";
import {
  ScanFace,
  Trash2,
  Camera,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const MAX_SIDE = 1280;

type Report = {
  similarity: number;
  verdict: Verdict;
  quality: Quality[];
};

/** When set, the hire can send the score (never the photos) back to their employer. */
export type FaceSession = {
  token: string;
  businessName: string;
  onSent?: () => void;
};

export function FaceLab({ session }: { session?: FaceSession }) {
  const [sent, setSent] = useState<"" | "sending" | "sent">("");
  const [sendError, setSendError] = useState("");
  const [files, setFiles] = useState<(File | null)[]>([null, null]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [camera, setCamera] = useState<number | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const cameraRun = useRef(0);
  const runId = useRef(0);
  const processing = useRef(false);
  const form = useRef<HTMLFormElement>(null);

  function stopCamera() {
    cameraRun.current++;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCamera(null);
  }
  async function startCamera(index: number) {
    stopCamera();
    const request = cameraRun.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Camera capture needs a secure browser connection. You can upload a photo instead.",
        );
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      if (request !== cameraRun.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      setCamera(index);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Camera unavailable: ${error.message}. Upload a photo to continue.`
          : "Camera unavailable. Upload a photo instead.",
      );
    }
  }
  useEffect(() => {
    if (camera !== null && video.current) {
      video.current.srcObject = stream.current;
      void video.current
        .play()
        .catch(() =>
          setMessage("Press play on the camera preview, or upload a photo."),
        );
    }
  }, [camera]);
  async function capture() {
    if (!video.current || camera === null || !video.current.videoWidth) return;
    const index = camera;
    const request = cameraRun.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.current.videoWidth;
    canvas.height = video.current.videoHeight;
    canvas.getContext("2d")?.drawImage(video.current, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    canvas.width = canvas.height = 0;
    if (request !== cameraRun.current || !blob) return;
    setFiles((old) =>
      old.map((file, i) =>
        i === index
          ? new File([blob], "camera-photo.jpg", { type: "image/jpeg" })
          : file,
      ),
    );
    setReport(null);
    stopCamera();
  }
  useEffect(() => {
    const urls = files.map((file) => (file ? URL.createObjectURL(file) : ""));
    setPreviews(urls);
    return () => urls.forEach((url) => url && URL.revokeObjectURL(url));
  }, [files]);
  async function sendResults() {
    if (!session || !report) return;
    setSent("sending");
    setSendError("");
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "result",
          token: session.token,
          similarity: report.similarity,
          warnings: report.quality.reduce((n, q) => n + q.warnings.length, 0),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not send results.");
      setSent("sent");
      session.onSent?.();
    } catch (error) {
      setSent("");
      setSendError(
        error instanceof Error ? error.message : "Could not send results.",
      );
    }
  }
  function clear() {
    runId.current++;
    stopCamera();
    setSent("");
    setSendError("");
    setReport(null);
    setFiles([null, null]);
    setConsent(false);
    setMessage("");
    setBusy(processing.current);
    form.current?.reset();
  }
  useEffect(
    () => () => {
      runId.current++;
      cameraRun.current++;
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  async function compare(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || !files[0] || !files[1] || processing.current) return;
    processing.current = true;
    const current = ++runId.current;
    setBusy(true);
    stopCamera();
    setReport(null);
    const embeddings: Float32Array[] = [];
    const quality: Quality[] = [];
    setMessage("Loading the face models on this device…");
    try {
      const engine = await loadFaceEngine();
      for (const file of files) {
        if (current !== runId.current) return;
        const label =
          embeddings.length === 0 ? "reference photo" : "comparison photo";
        setMessage(`Analyzing the ${label}: finding the face and aligning it…`);
        const bitmap = await createImageBitmap(file!, {
          imageOrientation: "from-image",
        });
        if (bitmap.width * bitmap.height > 40_000_000) {
          bitmap.close();
          throw new Error(
            "Photo dimensions are too large. Use an image under 40 megapixels.",
          );
        }
        const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = canvas.height = 0;
        const faces = await engine.detect(image);
        const face = largestFace(faces);
        if (!face)
          throw new Error(
            `No face found in the ${label}. Use one clear, front-facing person, with the whole face visible.`,
          );
        const sharp = sharpnessOf(image.data, image.width, image.height, face.box);
        quality.push(assessQuality(faces, face, image.width, image.height, sharp));
        embeddings.push(await engine.embed(image, face));
      }
      if (current !== runId.current) return;
      const similarity = cosine(embeddings[0], embeddings[1]);
      if (!Number.isFinite(similarity))
        throw new Error("The comparison could not be calculated.");
      setReport({ similarity, verdict: verdictFor(similarity), quality });
      setMessage(
        "Comparison complete. Photos stay on this page until you clear them or leave.",
      );
    } catch (error) {
      if (current === runId.current)
        setMessage(
          error instanceof Error
            ? error.message
            : "This browser could not run the face model. Try a recent Chrome, Safari, or Edge.",
        );
    } finally {
      embeddings.forEach((embedding) => embedding.fill(0));
      processing.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="face-lab">
      <div className="callout scan-privacy">
        <ShieldCheck size={22} />
        <p>
          Compare two photos you have permission to use. Processing runs in this
          browser; photos and face data are not uploaded or saved to your
          workspace.
        </p>
      </div>
      <form ref={form} onSubmit={compare}>
        <label className="consent-label">
          <input
            type="checkbox"
            checked={consent}
            disabled={busy}
            onChange={(e) => {
              if (!e.target.checked) clear();
              else setConsent(true);
            }}
          />{" "}
          I have permission to compare these photos and understand this is an
          experimental similarity measurement.
        </label>
        <div className="face-inputs">
          {["Reference photo", "Comparison photo"].map((label, index) => (
            <section key={label} className="scan-photo">
              <label
                htmlFor={`scan-photo-${index}`}
                className="scan-photo-title"
              >
                <span>{index + 1}</span>
                {label}
              </label>
              <span className="scan-photo-hint">
                {index === 0
                  ? "Start with a clear, recent portrait."
                  : "Use a second photo or take one now."}
              </span>
              <input
                id={`scan-photo-${index}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={!consent || busy}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setReport(null);
                  setMessage("");
                  if (
                    file &&
                    (!["image/jpeg", "image/png", "image/webp"].includes(
                      file.type,
                    ) ||
                      file.size > 10 * 1024 * 1024)
                  ) {
                    setMessage("Use a JPEG, PNG, or WebP photo under 10 MB.");
                    e.target.value = "";
                    setFiles((previous) =>
                      previous.map((old, i) => (i === index ? null : old)),
                    );
                    return;
                  }
                  setFiles((previous) =>
                    previous.map((old, i) => (i === index ? file : old)),
                  );
                }}
              />
              {previews[index] ? (
                <img
                  src={previews[index]}
                  alt={label}
                  width="300"
                  height="220"
                />
              ) : (
                <div className="face-placeholder">
                  <ScanFace size={36} />
                  <span>One clear face</span>
                </div>
              )}
              <button
                type="button"
                className="button secondary scan-camera-button"
                disabled={!consent || busy}
                onClick={() => void startCamera(index)}
              >
                <Camera size={16} /> Use camera
              </button>
            </section>
          ))}
        </div>

        {camera !== null && (
          <section className="scan-camera" aria-label="Camera capture">
            <h3>
              {camera === 0 ? "Reference" : "Comparison"} photo · camera preview
            </h3>
            <p>
              Face the camera at eye level. Use even lighting and keep your
              entire face visible.
            </p>
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              controls
              aria-label="Live camera preview"
            />
            <div className="ev-actions">
              <button
                type="button"
                className="button"
                onClick={() => void capture()}
              >
                Capture photo
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={stopCamera}
              >
                Close camera
              </button>
            </div>
            <p className="small">
              Capturing a photo does not perform a liveness check.
            </p>
          </section>
        )}
        <div className="actions">
          <button
            className="button"
            disabled={busy || !consent || files.some((file) => !file)}
          >
            {busy ? "Comparing…" : "Compare on this device"}
          </button>
          <button type="button" className="button secondary" onClick={clear}>
            <Trash2 size={16} />
            Clear photos & result
          </button>
        </div>
      </form>
      <div aria-live="polite" aria-busy={busy} className="scan-status">
        {message && (
          <p role="status">
            {busy && <ScanFace size={18} />} {message}
          </p>
        )}
        {busy && <progress aria-label="Face analysis in progress" />}
        {report && (
          <div className="face-result">
            <div className="scan-result-heading">
              <CheckCircle2 size={22} />
              <h2>Comparison report</h2>
              <span>Processed locally</span>
            </div>
            <div className={`scan-verdict ${report.verdict.band}`}>
              <h3>{report.verdict.title}</h3>
              <p>{report.verdict.detail}</p>
            </div>
            <div className="scan-score">
              <strong>{report.similarity.toFixed(2)}</strong>
              <div>
                <b>Cosine similarity</b>
                <span>
                  Same person averages about 0.66 and different people about
                  0.08 on the LFW test set. The model&apos;s own cutoff is
                  0.36.
                </span>
              </div>
            </div>
            <meter
              min="-0.2"
              max="1"
              low={0.25}
              high={0.363}
              optimum={1}
              value={report.similarity}
              aria-label="Cosine similarity"
            />
            <div className="scan-measurements">
              {report.quality.map((q, index) => (
                <section key={index}>
                  <h3>{index === 0 ? "Reference photo" : "Comparison photo"}</h3>
                  <dl>
                    <div>
                      <dt>Detection confidence</dt>
                      <dd>{q.detectionScore}%</dd>
                    </div>
                    <div>
                      <dt>Face size</dt>
                      <dd>{q.faceSize} px</dd>
                    </div>
                    <div>
                      <dt>Head tilt</dt>
                      <dd>{q.tiltDegrees}°</dd>
                    </div>
                  </dl>
                  {q.warnings.length ? (
                    <ul className="scan-warnings">
                      {q.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Good photo quality for comparison.</p>
                  )}
                </section>
              ))}
            </div>
            <p>
              This is a similarity measurement, not proof of identity. Lighting,
              pose, image quality, and model bias affect it, and there is no
              liveness check, so a photo of a photo can fool it.
            </p>
            {session && (
              <div className="check-send">
                <h3>Send results to {session.businessName}</h3>
                {sent === "sent" ? (
                  <p role="status">
                    Sent. Only the similarity score and quality warnings were
                    shared. You can clear your photos and close this page.
                  </p>
                ) : (
                  <>
                    <p>
                      This shares the score above and the number of photo
                      warnings. Your photos and face data stay on this device.
                    </p>
                    <button
                      type="button"
                      className="button"
                      onClick={() => void sendResults()}
                      disabled={sent === "sending"}
                    >
                      {sent === "sending" ? "Sending…" : "Send results"}
                    </button>
                    {sendError && (
                      <p role="alert" className="fc-error">
                        {sendError}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
