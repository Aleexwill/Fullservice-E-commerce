import { prisma } from './prisma';

export type CategoryScope = 'productos' | 'trabajos' | 'servicios' | 'inventario';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  scope: string;
  isActive: boolean;
  order: number;
}

function toItem(c: any): CategoryItem {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    scope: c.scope,
    isActive: c.isActive,
    order: c.order,
  };
}

export async function getCategorias(scope?: CategoryScope, onlyActive = false): Promise<CategoryItem[]> {
  const where: any = {};
  if (scope) where.scope = scope;
  if (onlyActive) where.isActive = true;
  const rows = await prisma.category.findMany({ where, orderBy: [{ order: 'asc' }, { name: 'asc' }] });
  return rows.map(toItem);
}

export async function createCategoria(data: { name: string; slug: string; scope: CategoryScope; order?: number }): Promise<CategoryItem> {
  const row = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      scope: data.scope,
      order: data.order ?? 0,
    },
  });
  return toItem(row);
}

export async function updateCategoria(id: string, data: Partial<{ name: string; slug: string; isActive: boolean; order: number }>): Promise<CategoryItem> {
  const row = await prisma.category.update({ where: { id }, data });
  return toItem(row);
}

export async function deleteCategoria(id: string): Promise<void> {
  await prisma.category.delete({ where: { id } });
}
