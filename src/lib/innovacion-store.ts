import { prisma } from './prisma';
import type { InnovacionItem as PrismaInnovacionItem } from '@prisma/client';

export interface InnovacionItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  thumbnail: string;
  images: string[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

function toItem(i: PrismaInnovacionItem): InnovacionItem {
  let images: string[] = [];
  try { images = JSON.parse((i as any).images || '[]'); } catch {}
  return {
    id: i.id,
    title: i.title,
    description: i.description,
    mediaUrl: i.mediaUrl,
    mediaType: i.mediaType,
    thumbnail: i.thumbnail,
    images,
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
  const { images, ...rest } = data;
  const item = await prisma.innovacionItem.create({
    data: { ...rest, images: JSON.stringify(images ?? []) } as any,
  });
  return toItem(item);
}

export async function updateInnovacion(
  id: string,
  data: Partial<Omit<InnovacionItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<InnovacionItem | null> {
  try {
    const { images, ...rest } = data;
    const payload: any = { ...rest };
    if (images !== undefined) payload.images = JSON.stringify(images);
    const item = await prisma.innovacionItem.update({ where: { id }, data: payload });
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
