import { prisma } from './prisma';
import type { Service as PrismaService } from '@prisma/client';

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  features: string[];
  image: string;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

function toService(s: PrismaService): Service {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    icon: s.icon,
    features: s.features,
    image: s.image,
    isActive: s.isActive,
    isFeatured: s.isFeatured,
    order: s.order,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export async function getAllServices(): Promise<Service[]> {
  const all = await prisma.service.findMany({ orderBy: { order: 'asc' } });
  return all.map(toService);
}

export async function getServiceById(id: string): Promise<Service | null> {
  const s = await prisma.service.findUnique({ where: { id } });
  return s ? toService(s) : null;
}

export async function createService(data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
  const s = await prisma.service.create({ data });
  return toService(s);
}

export async function updateService(id: string, data: Partial<Service>): Promise<Service | null> {
  const { id: _id, createdAt: _createdAt, ...rest } = data;
  try {
    const s = await prisma.service.update({ where: { id }, data: rest });
    return toService(s);
  } catch {
    return null;
  }
}

export async function deleteService(id: string): Promise<boolean> {
  try {
    await prisma.service.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
