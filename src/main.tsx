import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/** Recover from chunk load failures after deployment by forcing a reload to get the latest index.html/manifest. */
window.addEventListener(
  "error",
  (e: ErrorEvent) => {
    // Detect dynamic import or script tag loading failures
    const isChunkError =
      /loading chunk|fetch dynamically imported module|script error/i.test(
        e.message,
      ) || e.target instanceof HTMLScriptElement;

    if (isChunkError) {
      const storageKey = "bluprnt_chunk_retry";
      const lastRetry = sessionStorage.getItem(storageKey);
      const now = Date.now();

      // Only attempt one reload per minute to avoid loops if there's a real 404/network issue
      if (!lastRetry || now - Number(lastRetry) > 60000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
      }
    }
  },
  true,
);

const APP_CACHE_NAMES = ["blueprint-ai-v1"];

/** PWA / service worker disabled: unregister any prior SW and drop app caches so stale HTML/JS isn’t served. */
async function clearServiceWorkerAndCaches(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    if (regs) await Promise.all(regs.map((r) => r.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => APP_CACHE_NAMES.some((n) => k.includes(n)))
        .map((k) => caches.delete(k)),
    );
  }
}

function mount() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void clearServiceWorkerAndCaches()
  .then(mount)
  .catch(() => {
    mount();
  });
