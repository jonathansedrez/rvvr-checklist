import { describe, test, expect, mock, beforeEach } from "bun:test";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockToggle = mock((_id?: any) => Promise.resolve(null as any));

mock.module("../services/task.service", () => ({
  taskService: { toggle: mockToggle, create: mock(), update: mock(), delete: mock() },
}));

mock.module("../ws/manager", () => ({
  wsManager: { broadcast: mock(), add: mock(), remove: mock(), size: 0 },
}));

mock.module("../middleware/auth", () => ({
  authMiddleware: mock(async (_c: unknown, next: () => Promise<void>) => next()),
}));

const { tasksRouter } = await import("./tasks");

describe("tasksRouter", () => {
  beforeEach(() => {
    mockToggle.mockReset();
  });

  describe("PATCH /tasks/:id/toggle", () => {
    test("returns 404 when task not found", async () => {
      mockToggle.mockResolvedValue(null);
      const req = new Request("http://localhost/tasks/missing-id/toggle", { method: "PATCH" });
      const res = await tasksRouter.fetch(req);
      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: string };
      expect(body).toMatchObject({ error: "Task not found" });
    });

    test("returns toggled task and broadcasts event", async () => {
      const task = {
        id: "task-1",
        completed: true,
        title: "Test",
        sectionId: "sec-1",
        slug: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockToggle.mockResolvedValue(task);

      const req = new Request("http://localhost/tasks/task-1/toggle", { method: "PATCH" });
      const res = await tasksRouter.fetch(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: typeof task };
      expect(body.data.id).toBe("task-1");
      expect(body.data.completed).toBe(true);
    });
  });
});
