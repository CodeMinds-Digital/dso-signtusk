/**
 * Vercel Serverless Function Entry Point
 * Adapts the Hono + React Router server for Vercel's serverless runtime
 */

export default async function handler(req, res) {
  // Dynamic import to ensure build artifacts are available
  const { default: server } =
    await import("../build/server/hono/server/router.js");
  const build = await import("../build/server/index.js");
  const { default: handle } = await import("hono-react-router-adapter/node");

  const reactRouterHandler = handle(build, server);

  try {
    // Build the full URL
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const url = new URL(req.url, `${protocol}://${host}`);

    // Convert headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    }

    // Collect body for non-GET requests
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      if (chunks.length > 0) {
        body = Buffer.concat(chunks);
      }
    }

    // Create Web Request
    const webRequest = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    // Get response from Hono handler
    const response = await reactRouterHandler.fetch(webRequest);

    // Set status
    res.statusCode = response.status;

    // Set headers
    response.headers.forEach((value, key) => {
      // Skip content-encoding as Vercel handles compression
      if (key.toLowerCase() !== "content-encoding") {
        res.setHeader(key, value);
      }
    });

    // Send body
    if (response.body) {
      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      res.end(Buffer.concat(chunks));
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Serverless function error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Internal Server Error",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    );
  }
}
