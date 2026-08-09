import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: 'ferreteria-general' },
    update: {},
    create: {
      name: 'Ferretería General',
      slug: 'ferreteria-general',
      description: 'Herramientas e insumos generales',
    },
  });

  await prisma.product.upsert({
    where: { sku: 'DEMO-0001' },
    update: {},
    create: {
      sku: 'DEMO-0001',
      name: 'Producto de prueba',
      slug: 'producto-de-prueba',
      shortDescription: 'Producto de ejemplo para verificar la conexión con Supabase',
      categoryId: category.id,
      basePrice: 100000,
      images: [],
      tags: ['demo'],
      isActive: true,
    },
  });

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
