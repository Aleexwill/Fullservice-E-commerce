# Depósitos e inventario

Menú **Servicios → Depósitos e inventario** (`/admin/depositos`). Es independiente de la *Lista de precios* (`/admin/inventario`), que sigue siendo el catálogo de materiales con precio para presupuestos.

## Qué permite
- **Crear depósitos** (nombre único, dirección, responsable, notas). Se pueden editar, desactivar y eliminar **solo si están vacíos**; con artículos hay que moverlos o desactivarlo.
- **Cargar artículos eligiendo el depósito** (obligatorio): nombre, código, cantidad, unidad, stock mínimo, ubicación (estante/pasillo), categoría, descripción, notas y **hasta 5 fotos**.
- **Mover un artículo a otro depósito** editándolo y cambiando el depósito. El código no puede repetirse dentro de un mismo depósito (sí entre depósitos).
- Buscar por nombre, código, categoría o ubicación; filtrar por depósito; ver **solo lo que está bajo el mínimo** (se marca en naranja cuando cantidad ≤ stock mínimo).

## Fotos
Desde el teléfono se puede sacar la foto en el momento o elegirla de la galería. El navegador la **reduce (lado mayor 1600 px, JPEG)** antes de subirla. Formatos JPG/PNG/WEBP (verificados por contenido), máx. 4 MB. Con `BLOB_READ_WRITE_TOKEN` van a Vercel Blob (`inventario/`); sin él se guardan en la base (máx. 1,5 MB por foto).

## Permisos
Usa `canManageInventory` (admin, planner y técnico por defecto, igual que la lista de precios). Rutas `/admin/depositos` y `/api/depositos` restringidas por middleware.

## Base de datos
Migración `23_depositos`: tablas `Deposito` e `ItemInventario` (solo crea tablas).

## Fuera de alcance (posibles siguientes pasos)
Historial de movimientos (entradas/salidas), traslados con registro, vínculo con la lista de precios de materiales, importación masiva y etiquetas con QR.
