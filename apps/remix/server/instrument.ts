import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn:
    process.env.SENTRY_DSN_NODE ||
    "https://3d22ec4efbdd38f3c22f4c79eeebf003@o4510100871380992.ingest.de.sentry.io/4510647614636112",
  tracesSampleRate: 0.1, // Reduced for production performance
  environment: process.env.NODE_ENV || "development",
  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
});
