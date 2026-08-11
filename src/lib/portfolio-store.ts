import { prisma } from './prisma';
import type { Portfolio as PrismaPortfolio } from '@prisma/client';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  year: string;
  client: string;
  image: string;
  gallery: string[];
  badge: 'blue' | 'green' | 'yellow' | 'neutral';
  size: 'small' | 'large';
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

function toProject(p: PrismaPortfolio): Project {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    location: p.location,
    duration: p.duration,
    year: p.year,
    client: p.client,
    image: p.image,
    gallery: p.gallery,
    badge: p.badge as Project['badge'],
    size: p.size as Project['size'],
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    order: p.order,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function getAllProjects(): Promise<Project[]> {
  const all = await prisma.portfolio.findMany({ orderBy: { order: 'asc' } });
  return all.map(toProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const p = await prisma.portfolio.findUnique({ where: { id } });
  return p ? toProject(p) : null;
}

export async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const p = await prisma.portfolio.create({ data });
  return toProject(p);
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project | null> {
  const { id: _id, createdAt: _createdAt, ...rest } = data;
  try {
    const p = await prisma.portfolio.update({ where: { id }, data: rest });
    return toProject(p);
  } catch {
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    await prisma.portfolio.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
