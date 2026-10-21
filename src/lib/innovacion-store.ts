import { prisma } from './prisma';
import type { InnovacionItem as PrismaInnovacionItem } from '@prisma/client';

export interface InnovacionItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  thumbnail: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

function toItem(i: PrismaInnovacionItem): InnovacionItem {
  return {
    id: i.id,
    title: i.title,
    description: i.description,
    mediaUrl: i.mediaUrl,
    mediaType: i.mediaType,
    thumbnail: i.thumbnail,
    isActive: i.isActive,
    order: i.order,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

export async function getAllInnovaciones(onlyActive = false): Promise<InnovacionItem[]> {
  const items = await prisma.innovacionItem.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  return items.map(toItem);
}

export async function getInnovacionById(id: string): Promise<InnovacionItem | null> {
  const item = await prisma.innovacionItem.findUnique({ where: { id } });
  return item ? toItem(item) : null;
}

export async function createInnovacion(
  data: Omit<InnovacionItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<InnovacionItem> {
  const item = await prisma.innovacionItem.create({ data });
  return toItem(item);
}

export async function updateInnovacion(
  id: string,
  data: Partial<Omit<InnovacionItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<InnovacionItem | null> {
  try {
    const item = await prisma.innovacionItem.update({ where: { id }, data });
    return toItem(item);
  } catch {
    return null;
  }
}

export async function deleteInnovacion(id: string): Promise<boolean> {
  try {
    await prisma.innovacionItem.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
