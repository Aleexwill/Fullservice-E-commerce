export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createProduct, type Product } from '@/lib/products-store';
import { parseBody, CreateProductoSchema } from '@/lib/schemas';

const SORTABLE_FIELDS = ['createdAt', 'name', 'price', 'rating', 'salesCount', 'stock'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

function toProduct(p: any): Product {
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
    costPrice: p.costPrice == null ? null : Number(p.costPrice),
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

// GET /api/productos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build where clause
    const andClauses: any[] = [];
    const search = searchParams.get('search');
    if (search) {
      andClauses.push({ OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ]});
    }
    if (searchParams.get('category')) andClauses.push({ category: searchParams.get('category') });
    if (searchParams.get('active') === 'true') andClauses.push({ isActive: true });
    if (searchParams.get('featured') === 'true') andClauses.push({ isFeatured: true });
    if (searchParams.get('onSale') === 'true') {
      const now = new Date();
      andClauses.push(
        { promoDiscountPercent: { not: null } },
        { promoStartsAt: { lte: now } },
        { OR: [{ promoEndsAt: null }, { promoEndsAt: { gte: now } }] },
      );
    }
    const where = andClauses.length ? { AND: andClauses } : {};

    // Sort
    const sortParam = searchParams.get('sort') || 'createdAt';
    const sort: SortableField = SORTABLE_FIELDS.includes(sortParam as SortableField) ? (sortParam as SortableField) : 'createdAt';
    const order = (searchParams.get('order') || 'desc') === 'asc' ? 'asc' : 'desc';
    const orderBy: any = { [sort]: order };

    // Pagination
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 20), 1), 100);
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    const skip = (page - 1) * limit;

    const [rows, totalFiltered] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take: limit }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: rows.map(toProduct),
      total: totalFiltered,
      page,
      limit,
      totalPages: Math.ceil(totalFiltered / limit),
    });
  } catch (error) {
    console.error('Error en GET /api/productos:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener productos: ${message}` }, { status: 500 });
  }
}

// POST /api/productos
export async function POST(request: NextRequest) {
  const auth = await requireRole('canManageProducts');
  if (auth instanceof NextResponse) return auth;
  try {
    const parsed = await parseBody(request, CreateProductoSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const product = await createProduct({
      sku: body.sku,
      name: body.name,
      slug: body.slug ?? '',
      description: body.description ?? '',
      shortDescription: body.shortDescription ?? '',
      category: body.category ?? 'general',
      brand: body.brand ?? '',
      price: body.price,
      costPrice: body.costPrice ?? null,
      compareAtPrice: body.compareAtPrice ?? null,
      stock: body.stock ?? 0,
      images: body.images ?? [],
      specifications: body.specifications ?? {},
      tags: body.tags ?? [],
      isFeatured: body.isFeatured ?? false,
      isActive: body.isActive ?? true,
      promoDiscountPercent: body.promoDiscountPercent ?? null,
      promoStartsAt: body.promoStartsAt ?? null,
      promoEndsAt: body.promoEndsAt ?? null,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/productos:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al crear producto: ${message}` }, { status: 500 });
  }
}
