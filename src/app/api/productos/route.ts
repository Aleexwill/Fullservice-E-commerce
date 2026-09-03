import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createProduct, getEffectivePrice, type Product } from '@/lib/products-store';

const SORTABLE_FIELDS = ['createdAt', 'name', 'price', 'rating', 'salesCount', 'stock'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

// GET /api/productos
export async function GET(request: NextRequest) {
  try {
    const products = await getAllProducts();
    const { searchParams } = new URL(request.url);

    let filtered = [...products];

    // Filter by search
    const search = searchParams.get('search');
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    // Filter by category
    const category = searchParams.get('category');
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    // Filter by active
    const active = searchParams.get('active');
    if (active === 'true') {
      filtered = filtered.filter((p) => p.isActive);
    }

    // Filter by featured
    const featured = searchParams.get('featured');
    if (featured === 'true') {
      filtered = filtered.filter((p) => p.isFeatured);
    }

    // Filter by promocion vigente
    const onSale = searchParams.get('onSale');
    if (onSale === 'true') {
      filtered = filtered.filter((p) => getEffectivePrice(p).isOnSale);
    }

    // Sort (whitelist de campos para evitar acceso dinámico arbitrario)
    const sortParam = searchParams.get('sort') || 'createdAt';
    const sort: SortableField = SORTABLE_FIELDS.includes(sortParam as SortableField) ? (sortParam as SortableField) : 'createdAt';
    const order = searchParams.get('order') || 'desc';
    filtered.sort((a, b) => {
      const aVal = a[sort];
      const bVal = b[sort];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    // Pagination
    const totalFiltered = filtered.length;
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 20), 1), 100);
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      products: paginated,
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
  try {
    const body = await request.json();

    // Validacion basica
    if (!body.name || !body.sku || !body.price) {
      return NextResponse.json(
        { error: 'Nombre, SKU y precio son obligatorios' },
        { status: 400 }
      );
    }

    const product = await createProduct({
      sku: body.sku,
      name: body.name,
      slug: body.slug || '',
      description: body.description || '',
      shortDescription: body.shortDescription || '',
      category: body.category || 'general',
      brand: body.brand || '',
      price: Number(body.price),
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      stock: Number(body.stock) || 0,
      images: body.images || [],
      specifications: body.specifications || {},
      tags: body.tags || [],
      isFeatured: Boolean(body.isFeatured),
      isActive: body.isActive !== false,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      promoDiscountPercent: body.promoDiscountPercent ? Number(body.promoDiscountPercent) : null,
      promoStartsAt: body.promoStartsAt || null,
      promoEndsAt: body.promoEndsAt || null,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/productos:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al crear producto: ${message}` }, { status: 500 });
  }
}
