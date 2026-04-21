import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prisma } from "./lib/prisma";
import { supabase } from "./lib/supabase";

const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors());

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Test endpoint using Supabase REST API (HTTPS - bypasses port blocking)
app.get("/health/supabase", async (c) => {
  try {
    const { data: teams, error } = await supabase.from("teams").select("*");

    if (error) throw error;

    return c.json({
      status: "ok",
      connection: "supabase-rest",
      teamCount: teams?.length ?? 0,
      teams,
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.get("/health/db", async (c) => {
  try {
    const teamCount = await prisma.team.count();
    const sectionCount = await prisma.section.count();
    const taskCount = await prisma.task.count();

    return c.json({
      status: "ok",
      database: "connected",
      counts: {
        teams: teamCount,
        sections: sectionCount,
        tasks: taskCount,
      },
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

// GET /api/v1/teams - List all teams with sections and tasks
app.get("/api/v1/teams", async (c) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        sections: {
          include: {
            tasks: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return c.json({ data: teams });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Failed to fetch teams" }, 500);
  }
});

// GET /api/v1/teams/:id - Get single team with sections and tasks
app.get("/api/v1/teams/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            tasks: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!team) {
      return c.json({ error: "Team not found" }, 404);
    }

    return c.json({ data: team });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Failed to fetch team" }, 500);
  }
});

export { app };
