import { prisma } from './prisma';
import type { ClienteLogo as PrismaClienteLogo } from '@prisma/client';

export interface ClienteLogo {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  parentId: string | null;
  children?: ClienteLogo[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

function toClienteLogo(c: PrismaClienteLogo, children?: PrismaClienteLogo[]): ClienteLogo {
  return {
    id: c.id,
    name: c.name,
    logoUrl: c.logoUrl,
    website: c.website,
    parentId: c.parentId,
    children: children?.map((ch) => toClienteLogo(ch)) ?? [],
    isActive: c.isActive,
    order: c.order,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function getAllClientesLogo(): Promise<ClienteLogo[]> {
  const all = await prisma.clienteLogo.findMany({
    orderBy: { order: 'asc' },
    include: { children: { orderBy: { order: 'asc' } } },
    where: { parentId: null },
  });
  return all.map((c) => toClienteLogo(c, c.children));
}

export async function getClienteLogoById(id: string): Promise<ClienteLogo | null> {
  const c = await prisma.clienteLogo.findUnique({
    where: { id },
    include: { children: { orderBy: { order: 'asc' } } },
  });
  return c ? toClienteLogo(c, c.children) : null;
}

export async function createClienteLogo(
  data: Omit<ClienteLogo, 'id' | 'createdAt' | 'updatedAt' | 'children'>
): Promise<ClienteLogo> {
  const c = await prisma.clienteLogo.create({ data });
  return toClienteLogo(c);
}

export async function updateClienteLogo(
  id: string,
  data: Partial<Omit<ClienteLogo, 'children'>>
): Promise<ClienteLogo | null> {
  const { id: _id, createdAt: _ca, ...rest } = data;
  try {
    const c = await prisma.clienteLogo.update({ where: { id }, data: rest });
    return toClienteLogo(c);
  } catch {
    return null;
  }
}

export async function deleteClienteLogo(id: string): Promise<boolean> {
  try {
    await prisma.clienteLogo.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
