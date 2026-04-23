import { prisma } from "../lib/prisma";

export const teamService = {
  async findAll() {
    return prisma.team.findMany({
      include: {
        sections: {
          include: { tasks: { orderBy: { createdAt: "asc" } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async findById(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: {
        sections: {
          include: { tasks: { orderBy: { createdAt: "asc" } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async create(data: { name: string }) {
    return prisma.team.create({ data });
  },

  async update(id: string, data: { name: string }) {
    return prisma.team.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.team.delete({ where: { id } });
  },
};
