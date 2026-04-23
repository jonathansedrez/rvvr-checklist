import { prisma } from "../lib/prisma";

export const sectionService = {
  async create(teamId: string, data: { name: string }) {
    return prisma.section.create({ data: { ...data, teamId } });
  },

  async update(id: string, data: { name: string }) {
    return prisma.section.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.section.delete({ where: { id } });
  },
};
