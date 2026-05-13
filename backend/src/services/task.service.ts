import { prisma } from "../lib/prisma";

export const taskService = {
  async create(sectionId: string, data: { title: string; slug?: string | null }) {
    return prisma.task.create({ data: { ...data, sectionId } });
  },

  async update(id: string, data: { title?: string; slug?: string | null }) {
    return prisma.task.update({ where: { id }, data });
  },

  async toggle(id: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return null;
    return prisma.task.update({
      where: { id },
      data: { completed: !task.completed },
    });
  },

  async delete(id: string) {
    return prisma.task.delete({ where: { id } });
  },
};
