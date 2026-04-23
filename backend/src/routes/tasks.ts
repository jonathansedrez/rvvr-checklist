import { Hono } from "hono";
import { z } from "zod";
import { taskService } from "../services/task.service";
import { wsManager } from "../ws/manager";
import { authMiddleware } from "../middleware/auth";
import { Prisma } from "../generated/prisma/client";

const router = new Hono();

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().nullish(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().nullish(),
});

router.patch("/tasks/:id/toggle", async (c) => {
  const { id } = c.req.param();
  const task = await taskService.toggle(id);
  if (!task) return c.json({ error: "Task not found" }, 404);
  wsManager.broadcast("task:toggled", { taskId: task.id, completed: task.completed });
  return c.json({ data: task });
});

router.post("/sections/:sectionId/tasks", authMiddleware, async (c) => {
  const { sectionId } = c.req.param();
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Invalid JSON" }, 400);

  const result = createTaskSchema.safeParse(body);
  if (!result.success) return c.json({ error: result.error.flatten() }, 400);

  try {
    const task = await taskService.create(sectionId, result.data);
    return c.json({ data: task }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return c.json({ error: "Section not found" }, 404);
    }
    throw error;
  }
});

router.put("/tasks/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Invalid JSON" }, 400);

  const result = updateTaskSchema.safeParse(body);
  if (!result.success) return c.json({ error: result.error.flatten() }, 400);

  try {
    const task = await taskService.update(id, result.data);
    return c.json({ data: task });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Task not found" }, 404);
    }
    throw error;
  }
});

router.delete("/tasks/:id", authMiddleware, async (c) => {
  const { id } = c.req.param();

  try {
    await taskService.delete(id);
    return c.json({ data: null });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return c.json({ error: "Task not found" }, 404);
    }
    throw error;
  }
});

export { router as tasksRouter };
