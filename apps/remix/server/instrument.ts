import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://3d22ec4efbdd38f3c22f4c79eeebf003@o4510100871380992.ingest.de.sentry.io/4510647614636112",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || "development",
});
