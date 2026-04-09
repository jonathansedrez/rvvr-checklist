import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors());

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

export { app };
