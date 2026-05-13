import { Hono } from "hono";
import { z } from "zod";
import { teamService } from "../services/team.service";
import { authMiddleware } from "../middleware/auth";
import { Prisma } from "../generated/prisma/client";

const router = new Hono();

const teamSchema = z.object({
  name: z.string().min(1).max(100),
});

router.get("/", async (c) => {
  const teams = await teamService.findAll();
  return c.json({ data: teams });
});

router.get("/:id", async (c) => {
  const { id } = c.req.param();
  const team = await teamService.findById(id);
  if (!team) return c.json({ error: "Team not found" }, 404);
  return c.json({ data: team });
});

router.post("/", authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Invalid JSON" }, 400);

  const result = teamSchema.safeParse(body);
  if (!result.success) return c.json({ error: result.error.flatten() }, 400);

  const team = await teamService.create(result.data);
  return c.json({ data: team }, 201);
});

router.put("/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Invalid JSON" }, 400);

  const result = teamSchema.safeParse(body);
  if (!result.success) return c.json({ error: result.error.flatten() }, 400);

  try {
    const team = await teamService.update(id, result.data);
    return c.json({ data: team });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Team not found" }, 404);
    }
    throw error;
  }
});

router.delete("/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();

  try {
    await teamService.delete(id);
    return c.json({ data: null });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Team not found" }, 404);
    }
    throw error;
  }
});

export { router as teamsRouter };
