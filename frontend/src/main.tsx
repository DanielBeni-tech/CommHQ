import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUiStore } from "@/stores/uiStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== "true") {
    // En cas de bascule mock → vrai backend, l'ancien Service Worker MSW
    // peut rester enregistré dans le navigateur et continuer à intercepter
    // les requêtes. On le désinscrit explicitement pour éviter ce piège.
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const r of registrations) {
        const url = r.active?.scriptURL ?? "";
        if (url.includes("mockServiceWorker")) {
          await r.unregister();
        }
      }
    }
    return;
  }
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

function Root() {
  const theme = useUiStore((s) => s.theme);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={300}>
          <App />
          <Toaster richColors position="top-right" theme={theme} />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Root />
    </StrictMode>
  );
});
