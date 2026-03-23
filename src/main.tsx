import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const APP_CACHE_NAMES = ["blueprint-ai-v1"];

/** PWA / service worker disabled: unregister any prior SW and drop app caches so stale HTML/JS isn’t served. */
async function clearServiceWorkerAndCaches(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
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
