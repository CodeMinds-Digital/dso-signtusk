import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Test endpoint is working",
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabase: !!process.env.NEXT_PRIVATE_DATABASE_URL,
      hasAuth: !!process.env.NEXTAUTH_SECRET,
    },
  });
});

export default app;
