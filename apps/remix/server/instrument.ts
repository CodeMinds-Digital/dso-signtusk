// Sentry server-side initialization
// Note: Sentry is loaded dynamically to reduce initial bundle size

export const initSentry = async () => {
  if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN_NODE) {
    try {
      const Sentry = await import("@sentry/remix");
      Sentry.init({
        dsn: process.env.SENTRY_DSN_NODE,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV || "production",
      });
      return Sentry;
    } catch (e) {
      console.warn("Failed to initialize Sentry:", e);
    }
  }
  return null;
};

// Export a no-op captureException for when Sentry is not loaded
export const captureException = (
  error: unknown,
  context?: Record<string, unknown>
) => {
  console.error("[Error]", error, context);
};
