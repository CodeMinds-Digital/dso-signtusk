// Server-side error logging
// Sentry has been removed to reduce serverless bundle size

export const captureException = (
  error: unknown,
  context?: Record<string, unknown>
) => {
  console.error("[Server Error]", error, context);
};
