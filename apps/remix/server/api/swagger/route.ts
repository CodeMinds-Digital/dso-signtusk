import { Hono } from "hono";

import { API_V2_BETA_URL, API_V2_URL } from "@signtusk/lib/constants/app";

const swaggerRoute = new Hono();

/**
 * Swagger UI HTML template
 * Uses relative URLs to avoid CORS issues with Vercel preview deployments
 */
const getSwaggerHtml = (specPath: string, title: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .swagger-ui .topbar {
      display: none;
    }
    .swagger-ui .info {
      margin: 20px 0;
    }
    .swagger-ui .info .title {
      font-size: 2rem;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      // Use relative URL to avoid CORS issues with preview deployments
      const specUrl = window.location.origin + "${specPath}";
      const ui = SwaggerUIBundle({
        url: specUrl,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        tryItOutEnabled: true,
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
`;

/**
 * Swagger UI for v2 API
 */
swaggerRoute.get("/v2", (c) => {
  const specPath = `${API_V2_URL}/openapi.json`;
  return c.html(getSwaggerHtml(specPath, "Documenso API v2 - Swagger UI"));
});

/**
 * Swagger UI for v2 beta API
 */
swaggerRoute.get("/v2-beta", (c) => {
  const specPath = `${API_V2_BETA_URL}/openapi.json`;
  return c.html(getSwaggerHtml(specPath, "Documenso API v2 Beta - Swagger UI"));
});

/**
 * Default redirect to v2 Swagger
 */
swaggerRoute.get("/", (c) => {
  return c.redirect("/api/swagger/v2");
});

/**
 * API documentation index page
 */
swaggerRoute.get("/docs", (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documenso API Documentation</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #1a1a2e;
      margin-bottom: 10px;
      font-size: 2rem;
    }
    p {
      color: #666;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .api-links {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .api-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      text-decoration: none;
      color: #1a1a2e;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }
    .api-link:hover {
      background: #e9ecef;
      border-color: #667eea;
      transform: translateY(-2px);
    }
    .api-link .info h3 {
      margin-bottom: 5px;
      font-size: 1.1rem;
    }
    .api-link .info span {
      color: #888;
      font-size: 0.9rem;
    }
    .api-link .arrow {
      font-size: 1.5rem;
      color: #667eea;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: #667eea;
      color: white;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 8px;
    }
    .badge.beta {
      background: #f59e0b;
    }
    .json-links {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .json-links h4 {
      color: #888;
      font-size: 0.9rem;
      margin-bottom: 10px;
    }
    .json-links a {
      color: #667eea;
      text-decoration: none;
      font-size: 0.9rem;
      margin-right: 20px;
    }
    .json-links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📚 API Documentation</h1>
    <p>Welcome to the Documenso API documentation. Choose an API version below to explore the available endpoints using Swagger UI.</p>
    
    <div class="api-links">
      <a href="/api/swagger/v2" class="api-link">
        <div class="info">
          <h3>API v2 <span class="badge">Stable</span></h3>
          <span>Production-ready API endpoints</span>
        </div>
        <span class="arrow">→</span>
      </a>
      
      <a href="/api/swagger/v2-beta" class="api-link">
        <div class="info">
          <h3>API v2 Beta <span class="badge beta">Beta</span></h3>
          <span>Preview of upcoming features</span>
        </div>
        <span class="arrow">→</span>
      </a>
    </div>
    
    <div class="json-links">
      <h4>OpenAPI Specifications (JSON)</h4>
      <a href="${API_V2_URL}/openapi.json" target="_blank">v2 OpenAPI Spec</a>
      <a href="${API_V2_BETA_URL}/openapi.json" target="_blank">v2 Beta OpenAPI Spec</a>
    </div>
  </div>
</body>
</html>
  `);
});

export { swaggerRoute };
