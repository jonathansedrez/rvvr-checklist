import { Hono } from "hono";
import { z } from "zod";
import { sectionService } from "../services/section.service";
import { authMiddleware } from "../middleware/auth";
import { Prisma } from "../generated/prisma/client";

const router = new Hono();

const sectionSchema = z.object({
  name: z.string().min(1).max(100),
});

router.post("/teams/:teamId/sections", authMiddleware, async (c) => {
  const { teamId } = c.req.param();
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Invalid JSON" }, 400);

  const result = sectionSchema.safeParse(body);
  if (!result.success) return c.json({ error: result.error.flatten() }, 400);

  try {
    const section = await sectionService.create(teamId, result.data);
    return c.json({ data: section }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return c.json({ error: "Team not found" }, 404);
    }
    throw error;
  }
});

router.put("/sections/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Invalid JSON" }, 400);

  const result = sectionSchema.safeParse(body);
  if (!result.success) return c.json({ error: result.error.flatten() }, 400);

  try {
    const section = await sectionService.update(id, result.data);
    return c.json({ data: section });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Section not found" }, 404);
    }
    throw error;
  }
});

router.delete("/sections/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();

  try {
    await sectionService.delete(id);
    return c.json({ data: null });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Section not found" }, 404);
    }
    throw error;
  }
});

export { router as sectionsRouter };
