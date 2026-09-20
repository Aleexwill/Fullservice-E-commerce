#!/usr/bin/env bash
# =============================================================
# Full Service & Clean — Exportar datos de producción
# Genera un archivo SQL con INSERT de todos los registros actuales
# Uso:  bash scripts/export-data.sh > backup-$(date +%Y%m%d).sql
# Requiere: psql apuntando a la DB de producción
#   export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
# =============================================================

set -euo pipefail

DB="${DATABASE_URL:-}"
if [ -z "$DB" ]; then
  echo "ERROR: Definir DATABASE_URL antes de ejecutar." >&2
  exit 1
fi

echo "-- Backup generado el $(date '+%Y-%m-%d %H:%M:%S')"
echo "-- Full Service & Clean"
echo ""

TABLAS=(
  Presupuesto
  Material
  Cliente
  ClienteLogo
  Portfolio
  Service
  CarouselSlide
  PromoBanner
  SiteSettings
  SiteContent
  CustomRole
  User
)

for TABLA in "${TABLAS[@]}"; do
  echo "-- ── $TABLA ────────────────────────────────────────────────"
  psql "$DB" -c "\\COPY (SELECT * FROM \"$TABLA\") TO STDOUT WITH (FORMAT csv, HEADER true, FORCE_QUOTE *)" 2>/dev/null \
    | head -1 | awk -v t="$TABLA" 'BEGIN{print "-- (tabla vacía o sin acceso)"}'
  # Dump completo con INSERT
  pg_dump "$DB" \
    --table="$TABLA" \
    --data-only \
    --column-inserts \
    --no-owner \
    --no-privileges \
    --no-comments \
    2>/dev/null || echo "-- (sin datos o sin acceso a $TABLA)"
  echo ""
done

echo "-- FIN DEL BACKUP"
