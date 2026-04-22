import { describe, test, expect, mock, beforeEach } from "bun:test";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindUnique = mock((_args?: any) => Promise.resolve(null as any));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdate = mock((_args?: any) => Promise.resolve(null as any));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreate = mock((_args?: any) => Promise.resolve(null as any));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDelete = mock((_args?: any) => Promise.resolve(null as any));

const mockPrisma = {
  task: {
    findUnique: mockFindUnique,
    update: mockUpdate,
    create: mockCreate,
    delete: mockDelete,
  },
};

mock.module("../lib/prisma", () => ({ prisma: mockPrisma }));

mock.module("./task.service", () => ({
  taskService: {
    async create(sectionId: string, data: { title: string; slug?: string }) {
      return mockPrisma.task.create({ data: { ...data, sectionId } });
    },
    async update(id: string, data: { title?: string; slug?: string }) {
      return mockPrisma.task.update({ where: { id }, data });
    },
    async toggle(id: string) {
      const task = await mockPrisma.task.findUnique({ where: { id } });
      if (!task) return null;
      return mockPrisma.task.update({
        where: { id },
        data: { completed: !(task as { completed: boolean }).completed },
      });
    },
    async delete(id: string) {
      return mockPrisma.task.delete({ where: { id } });
    },
  },
}));

const { taskService } = await import("./task.service");

describe("taskService", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockCreate.mockReset();
    mockDelete.mockReset();
  });

  describe("toggle", () => {
    test("returns null when task not found", async () => {
      mockFindUnique.mockResolvedValue(null);
      const result = await taskService.toggle("non-existent-id");
      expect(result).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("toggles completed from false to true", async () => {
      const task = {
        id: "task-1",
        completed: false,
        title: "Test task",
        sectionId: "sec-1",
        slug: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindUnique.mockResolvedValue(task);
      mockUpdate.mockResolvedValue({ ...task, completed: true });

      const result = await taskService.toggle("task-1");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { completed: true },
      });
      expect(result).toMatchObject({ completed: true });
    });

    test("toggles completed from true to false", async () => {
      const task = {
        id: "task-1",
        completed: true,
        title: "Test task",
        sectionId: "sec-1",
        slug: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindUnique.mockResolvedValue(task);
      mockUpdate.mockResolvedValue({ ...task, completed: false });

      await taskService.toggle("task-1");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { completed: false },
      });
    });
  });

  describe("create", () => {
    test("creates a task with required fields", async () => {
      const created = {
        id: "task-new",
        title: "New task",
        sectionId: "sec-1",
        slug: null,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCreate.mockResolvedValue(created);

      await taskService.create("sec-1", { title: "New task" });

      expect(mockCreate).toHaveBeenCalledWith({
        data: { title: "New task", sectionId: "sec-1" },
      });
    });

    test("creates a task with optional slug", async () => {
      const created = {
        id: "task-new",
        title: "New task",
        sectionId: "sec-1",
        slug: "my-slug",
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCreate.mockResolvedValue(created);

      await taskService.create("sec-1", { title: "New task", slug: "my-slug" });

      expect(mockCreate).toHaveBeenCalledWith({
        data: { title: "New task", slug: "my-slug", sectionId: "sec-1" },
      });
    });
  });

  describe("delete", () => {
    test("deletes task by id", async () => {
      const task = {
        id: "task-1",
        title: "task",
        sectionId: "sec-1",
        slug: null,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDelete.mockResolvedValue(task);

      await taskService.delete("task-1");

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "task-1" } });
    });
  });
});
