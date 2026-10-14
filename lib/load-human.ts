import type Human from "@vladmandic/human";
declare global {
  interface Window {
    Human?: { default: typeof Human };
  }
}
let loading: Promise<typeof Human> | null = null;
export function loadHuman(): Promise<typeof Human> {
  if (window.Human?.default) return Promise.resolve(window.Human.default);
  if (!loading)
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/vendor/human-3.3.6.js";
      script.onload = () =>
        window.Human?.default
          ? resolve(window.Human.default)
          : reject(new Error("Face model library did not initialize."));
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error("Could not load the face model library."));
      };
      document.head.appendChild(script);
    });
  return loading;
}
