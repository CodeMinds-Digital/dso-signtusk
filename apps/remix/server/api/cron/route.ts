import { Hono } from "hono";
import { processPendingDocuments } from "./process-pending-documents";

const app = new Hono();

/**
 * Vercel Cron endpoint
 *
 * Vercel will call this endpoint based on the schedule in vercel.json
 *
 * Security: Vercel automatically adds Authorization header with cron secret
 * You can verify it with: req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
 */
app.get("/process-pending-documents", async (c) => {
  // Optional: Verify cron secret for additional security
  const authHeader = c.req.header("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log("[CRON] Unauthorized request");
    return c.json({ error: "Unauthorized" }, 401);
  }

  return processPendingDocuments(c);
});

export default app;
