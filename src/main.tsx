import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

// Register PWA service worker in production only (not preview / dev).
if (
  import.meta.env.PROD &&
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  window.self === window.top &&
  !/(^|\.)lovableproject\.com$/.test(window.location.hostname) &&
  !/^(id-)?preview--/.test(window.location.hostname) &&
  !new URLSearchParams(window.location.search).has("sw=off")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}