import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// Client-side error tracking can be added later with a lighter solution
// For now, we log errors to console
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("[Client Error]", event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[Unhandled Promise Rejection]", event.reason);
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
