"use client";
import { useEffect, useRef, useState } from "react";
import type Human from "@vladmandic/human";
import { loadHuman } from "@/lib/load-human";
import {
  ScanFace,
  Trash2,
  Camera,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
export function FaceLab() {
  const [files, setFiles] = useState<(File | null)[]>([null, null]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [details, setDetails] = useState<
    { confidence: number; pixels: number; coverage: number }[]
  >([]);
  const [camera, setCamera] = useState<number | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const cameraRun = useRef(0);
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
    setSimilarity(null);
    setDetails([]);
    stopCamera();
  }
  const model = useRef<Human | null>(null);
  const runId = useRef(0);
  const processing = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const urls = files.map((file) => (file ? URL.createObjectURL(file) : ""));
    setPreviews(urls);
    return () => urls.forEach((url) => url && URL.revokeObjectURL(url));
  }, [files]);
  function clear() {
    runId.current++;
    stopCamera();
    setDetails([]);
    setFiles([null, null]);
    setConsent(false);
    setSimilarity(null);
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
    setSimilarity(null);
    setDetails([]);
    const embeddings: number[][] = [];
    const measurements: {
      confidence: number;
      pixels: number;
      coverage: number;
    }[] = [];
    setMessage("Loading the face models on this device…");
    try {
      if (!model.current) {
        const Human = await loadHuman();
        model.current = new Human({
          backend: "webgl",
          modelBasePath: "/models/",
          cacheSensitivity: 0,
          skipAllowed: false,
          filter: { enabled: false },
          gesture: { enabled: false },
          body: { enabled: false },
          hand: { enabled: false },
          object: { enabled: false },
          face: {
            enabled: true,
            detector: { rotation: true, maxDetected: 2, minConfidence: 0.6 },
            mesh: { enabled: true },
            iris: { enabled: false },
            description: { enabled: true },
            emotion: { enabled: false },
            antispoof: { enabled: false },
            liveness: { enabled: false },
            gear: { enabled: false },
          },
        });
      }
      await model.current.load();
      for (const file of files) {
        if (current !== runId.current) return;
        const label =
          embeddings.length === 0 ? "Reference photo" : "Comparison photo";
        setMessage(
          `Analyzing ${label.toLowerCase()}: locating face and extracting features…`,
        );
        const bitmap = await createImageBitmap(file!);
        if (
          bitmap.width > 16000 ||
          bitmap.height > 16000 ||
          bitmap.width * bitmap.height > 40000000
        ) {
          bitmap.close();
          throw new Error(
            "Photo dimensions are too large. Use an image under 40 megapixels.",
          );
        }
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas
          .getContext("2d")!
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const width = canvas.width;
        const height = canvas.height;
        const result = await (async () => {
          try {
            return await model.current!.detect(canvas);
          } finally {
            canvas.width = 0;
            canvas.height = 0;
          }
        })();
        if (result.face.length !== 1)
          throw new Error(
            `${label}: found ${result.face.length} faces. Use one clear, front-facing person per photo.`,
          );
        if (!result.face[0].embedding?.length)
          throw new Error(
            "Could not extract a face descriptor. Try a sharper photo.",
          );
        const face = result.face[0];
        measurements.push({
          confidence: Math.round(face.boxScore * 100),
          pixels: Math.round(Math.min(face.box[2], face.box[3])),
          coverage: Math.round(
            ((face.box[2] * face.box[3]) / (width * height)) * 100,
          ),
        });
        embeddings.push([...face.embedding!]);
        face.embedding?.fill(0);
        // Do not retain demographic estimates or the library's image results.
        model.current.result.face = [];
        model.current.result.canvas = null;
      }
      const score = model.current.match.similarity(
        embeddings[0],
        embeddings[1],
      );
      embeddings.forEach((embedding) => embedding.fill(0));
      if (!Number.isFinite(score))
        throw new Error("The comparison could not be calculated.");
      if (current === runId.current) {
        setDetails(measurements);
        setSimilarity(Math.round(Math.max(0, Math.min(1, score)) * 100));
        setMessage(
          "Comparison complete. Photos remain on this page until you clear them or leave.",
        );
      }
    } catch (error) {
      if (current === runId.current)
        setMessage(
          error instanceof Error
            ? error.message
            : "This browser could not run the face model. Try a browser with WebGL enabled.",
        );
    } finally {
      embeddings.forEach((embedding) => embedding.fill(0));
      if (model.current) {
        model.current.result.face.forEach((face) => face.embedding?.fill(0));
        model.current.result.face = [];
        model.current.result.canvas = null;
      }
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
          browser; photos and descriptors are not uploaded or saved to your
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
                  setSimilarity(null);
                  setDetails([]);
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
                  <span>One clear face, no identity documents</span>
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
            <div className="actions">
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
        {similarity !== null && (
          <div className="face-result">
            <div className="scan-result-heading">
              <CheckCircle2 size={22} />
              <h2>Comparison report</h2>
              <span>Processed locally</span>
            </div>
            <div className="scan-score">
              <strong>
                {similarity}
                <small> / 100</small>
              </strong>
              <div>
                <b>Descriptor similarity</b>
                <span>A model measurement, not identity confidence.</span>
              </div>
            </div>
            <meter
              min="0"
              max="100"
              value={similarity}
              aria-label="Descriptor similarity"
            />
            <div className="scan-measurements">
              {details.map((detail, index) => (
                <section key={index}>
                  <h3>
                    {index === 0 ? "Reference photo" : "Comparison photo"}
                  </h3>
                  <dl>
                    <div>
                      <dt>Faces detected</dt>
                      <dd>1</dd>
                    </div>
                    <div>
                      <dt>Detection confidence</dt>
                      <dd>{detail.confidence}%</dd>
                    </div>
                    <div>
                      <dt>Face size in analyzed image</dt>
                      <dd>{detail.pixels} px</dd>
                    </div>
                    <div>
                      <dt>Image occupied by face</dt>
                      <dd>{detail.coverage}%</dd>
                    </div>
                  </dl>
                  <p>
                    {detail.pixels < 120
                      ? "Small face region. Try a closer, sharper portrait before interpreting the score."
                      : "Face region extracted. Even lighting and a front-facing pose help comparison."}
                  </p>
                </section>
              ))}
            </div>
            <p>
              This score is not the probability of a correct identity match.
              Lighting, image quality, model bias, and spoofed photos can affect
              it. There is no pass/fail threshold and no liveness check.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
