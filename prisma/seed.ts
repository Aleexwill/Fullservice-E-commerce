import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { sku: 'DEMO-0001' },
    update: {},
    create: {
      sku: 'DEMO-0001',
      name: 'Producto de prueba',
      slug: 'producto-de-prueba',
      shortDescription: 'Producto de ejemplo para verificar la conexión con Neon',
      category: 'ferreteria-general',
      brand: 'Genérico',
      price: 100000,
      stock: 10,
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
