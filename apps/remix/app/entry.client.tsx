import * as Sentry from "@sentry/remix";
import { startTransition, StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { useLocation, useMatches } from "react-router";
import { HydratedRouter } from "react-router/dom";

// Initialize Sentry for client-side error tracking
Sentry.init({
  dsn: "https://0fc9f9fb64f65238b82bc6029d3d3175@o4510100871380992.ingest.de.sentry.io/4510647583572048",
  tracesSampleRate: 0.1, // Sample 10% of transactions for performance
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions for replay
  replaysOnErrorSampleRate: 1.0, // Always capture replays on errors
  integrations: [
    Sentry.browserTracingIntegration({
      useEffect,
      useLocation,
      useMatches,
    }),
    // Only enable replay in production to reduce bundle size impact
    ...(process.env.NODE_ENV === "production"
      ? [Sentry.replayIntegration()]
      : []),
  ],
  environment: process.env.NODE_ENV || "development",
  enabled: process.env.NODE_ENV === "production",
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
