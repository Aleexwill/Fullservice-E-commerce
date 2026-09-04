import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Row counts per table
    const tables = [
      'Presupuesto', 'Pedido', 'Product', 'Cliente', 'Lead',
      'Service', 'Portfolio', 'Material', 'User', 'CarouselSlide',
      'PromoBanner', 'SiteSettings',
    ];

    const counts = await Promise.all(
      tables.map(async (t) => {
        try {
          const res = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*) as count FROM "${t}"`
          );
          return { table: t, rows: Number(res[0].count) };
        } catch {
          return { table: t, rows: null };
        }
      })
    );

    // Total DB size and per-table sizes
    const sizeRows = await prisma.$queryRaw<{ table_name: string; total_bytes: bigint; table_bytes: bigint; index_bytes: bigint }[]>`
      SELECT
        relname AS table_name,
        pg_total_relation_size(c.oid) AS total_bytes,
        pg_relation_size(c.oid)       AS table_bytes,
        pg_indexes_size(c.oid)        AS index_bytes
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
      ORDER BY total_bytes DESC
    `;

    const totalBytes = sizeRows.reduce((s, r) => s + Number(r.total_bytes), 0);

    // DB version
    const ver = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
    const version = ver[0]?.version?.split(' ').slice(0, 2).join(' ') ?? '';

    return NextResponse.json({
      totalBytes,
      version,
      tables: counts,
      sizes: sizeRows.map((r) => ({
        table: r.table_name,
        totalBytes: Number(r.total_bytes),
        tableBytes: Number(r.table_bytes),
        indexBytes: Number(r.index_bytes),
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
