import { prisma } from './prisma';
import type { Product as PrismaProduct } from '@prisma/client';

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: string[];
  specifications: Record<string, string>;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  salesCount: number;
  promoDiscountPercent: number | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export { getEffectivePrice } from './utils';

function toProduct(p: PrismaProduct): Product {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    description: p.description,
    shortDescription: p.shortDescription,
    category: p.category,
    brand: p.brand,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
    stock: p.stock,
    images: p.images,
    specifications: (p.specifications as Record<string, string>) ?? {},
    tags: p.tags,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    rating: p.rating,
    reviewCount: p.reviewCount,
    salesCount: p.salesCount,
    promoDiscountPercent: p.promoDiscountPercent,
    promoStartsAt: p.promoStartsAt ? p.promoStartsAt.toISOString() : null,
    promoEndsAt: p.promoEndsAt ? p.promoEndsAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return products.map(toProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const p = await prisma.product.findUnique({ where: { id } });
  return p ? toProduct(p) : null;
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  const p = await prisma.product.create({
    data: {
      ...data,
      slug: data.slug || slugify(data.name),
      compareAtPrice: data.compareAtPrice ?? undefined,
      promoStartsAt: data.promoStartsAt ? new Date(data.promoStartsAt) : undefined,
      promoEndsAt: data.promoEndsAt ? new Date(data.promoEndsAt) : undefined,
    },
  });
  return toProduct(p);
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
  const { id: _id, createdAt: _createdAt, ...rest } = data;
  try {
    const p = await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        compareAtPrice: rest.compareAtPrice ?? undefined,
        promoStartsAt: rest.promoStartsAt === undefined ? undefined : rest.promoStartsAt ? new Date(rest.promoStartsAt) : null,
        promoEndsAt: rest.promoEndsAt === undefined ? undefined : rest.promoEndsAt ? new Date(rest.promoEndsAt) : null,
      },
    });
    return toProduct(p);
  } catch {
    return null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await prisma.product.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getProductStats() {
  const products = await prisma.product.findMany();
  const active = products.filter((p) => p.isActive);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + Number(p.price) * p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const featured = products.filter((p) => p.isFeatured).length;
  const categories = [...new Set(products.map((p) => p.category))];
  const brands = [...new Set(products.map((p) => p.brand))];

  return {
    total: products.length,
    active: active.length,
    totalStock,
    totalValue,
    outOfStock,
    featured,
    categoriesCount: categories.length,
    brandsCount: brands.length,
    categories,
    brands,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
