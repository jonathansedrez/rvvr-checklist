import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors());

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// API routes will be mounted here
// app.route("/api/v1/teams", teams);
// app.route("/api/v1/sections", sections);
// app.route("/api/v1/tasks", tasks);

export { app };
