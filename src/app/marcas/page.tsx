import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { MarcasClient } from './marcas-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Marcas — Full Service & Clean',
  description: 'Explorá todas las marcas disponibles en nuestra tienda, ordenadas alfabéticamente.',
  alternates: { canonical: '/marcas' },
};

async function getBrands() {
  const groups = await prisma.product.groupBy({
    by: ['brand'],
    where: { isActive: true, brand: { not: '' } },
    _count: { id: true },
    orderBy: { brand: 'asc' },
  });
  return groups.map((g) => ({ name: g.brand, count: g._count.id }));
}

export default async function MarcasPage() {
  const brands = await getBrands();
  return (
    <Suspense>
      <MarcasClient brands={brands} />
    </Suspense>
  );
}
