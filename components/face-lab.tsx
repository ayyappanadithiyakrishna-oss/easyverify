"use client";
import { useEffect, useRef, useState } from "react";
import type Human from "@vladmandic/human";
import { loadHuman } from "@/lib/load-human";
import { ScanFace, Trash2 } from "lucide-react";
export function FaceLab() {
  const [files, setFiles] = useState<(File | null)[]>([null, null]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [similarity, setSimilarity] = useState<number | null>(null);
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
    },
    [],
  );
  async function compare(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || !files[0] || !files[1] || processing.current) return;
    processing.current = true;
    const current = ++runId.current;
    setBusy(true);
    setSimilarity(null);
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
        await model.current.load();
      }
      const embeddings: number[][] = [];
      for (const file of files) {
        if (current !== runId.current) return;
        setMessage("Finding one clear face in each photo…");
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
        const result = await model.current.detect(canvas);
        canvas.width = 0;
        canvas.height = 0;
        if (result.face.length !== 1)
          throw new Error(
            `Found ${result.face.length} faces in a photo. Use one clear, front-facing person per photo.`,
          );
        if (!result.face[0].embedding?.length)
          throw new Error(
            "Could not extract a face descriptor. Try a sharper photo.",
          );
        embeddings.push([...result.face[0].embedding]);
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
      processing.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="face-lab">
      <div className="callout">
        <ScanFace size={22} />
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
            <label key={label}>
              {label}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={!consent || busy}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSimilarity(null);
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
            </label>
          ))}
        </div>

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
      <div aria-live="polite">
        {message && <p>{message}</p>}
        {similarity !== null && (
          <div className="face-result">
            <strong>{similarity}/100</strong>
            <span>Model similarity score</span>
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
