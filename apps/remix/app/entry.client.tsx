import * as Sentry from "@sentry/remix";
import { startTransition, StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { useLocation, useMatches } from "react-router";
import { HydratedRouter } from "react-router/dom";

Sentry.init({
  dsn: "https://0fc9f9fb64f65238b82bc6029d3d3175@o4510100871380992.ingest.de.sentry.io/4510647583572048",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration({
      useEffect,
      useLocation,
      useMatches,
    }),
    Sentry.replayIntegration(),
  ],
  environment: process.env.NODE_ENV,
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
