import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prisma } from "./lib/prisma";
import { teamsRouter } from "./routes/teams";
import { sectionsRouter } from "./routes/sections";
import { tasksRouter } from "./routes/tasks";
import { authRouter } from "./routes/auth";

const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors());

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/health/db", async (c) => {
  try {
    const teamCount = await prisma.team.count();
    const sectionCount = await prisma.section.count();
    const taskCount = await prisma.task.count();

    return c.json({
      status: "ok",
      database: "connected",
      counts: { teams: teamCount, sections: sectionCount, tasks: taskCount },
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.route("/api/v1/teams", teamsRouter);
app.route("/api/v1", sectionsRouter);
app.route("/api/v1", tasksRouter);
app.route("/api/v1", authRouter);

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Internal server error" }, 500);
});

export { app };
