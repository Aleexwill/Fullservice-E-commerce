# Depósitos e inventario

Menú **Servicios → Depósitos e inventario** (`/admin/depositos`). Es independiente de la *Lista de precios* (`/admin/inventario`), que sigue siendo el catálogo de materiales con precio para presupuestos.

## Qué permite
- **Crear depósitos** (nombre único, dirección, responsable, notas). Se pueden editar, desactivar y eliminar **solo si están vacíos**; con artículos hay que moverlos o desactivarlo.
- **Cargar artículos eligiendo el depósito** (obligatorio): nombre, código, cantidad, unidad, stock mínimo, ubicación (estante/pasillo), categoría, descripción, notas y **hasta 5 fotos**.
- El código no puede repetirse dentro de un mismo depósito (sí entre depósitos). La cantidad y el depósito **ya no se editan a mano**: cambian solo con movimientos y traslados, para que todo quede en el historial.
- Buscar por nombre, código, categoría o ubicación; filtrar por depósito; ver **solo lo que está bajo el mínimo** (se marca en naranja cuando cantidad ≤ stock mínimo).

## Movimientos (historial)
Desde un artículo: **Entrada** (compra, devolución; remito opcional), **Salida** (motivo obligatorio; "entregado a / trabajo" y remito opcionales) y **Ajuste** (se informa el conteo real y el sistema calcula la diferencia; motivo obligatorio). Cada uno admite una foto opcional (remito, mercadería).
- **Nunca queda stock negativo**: una salida o traslado de más se rechaza. Se protege contra dos personas moviendo el mismo artículo a la vez (bloqueo por artículo).
- El artículo nuevo con cantidad inicial registra una entrada "Carga inicial". Los artículos cargados antes de esta versión empiezan su historial desde el primer movimiento.
- Pestaña **Historial**: filtros por artículo, depósito, tipo, fechas y texto (artículo, motivo, remito, usuario); cada línea muestra quién, cuándo, la diferencia y el saldo resultante. El historial **se conserva aunque se elimine el artículo**.

## Traslados con confirmación
1. Desde el artículo, **Trasladar** → depósito de destino y cantidad. El stock **sale del origen** y queda **en tránsito**.
2. En la pestaña **Traslados** (con contador de pendientes), quien recibe toca **Confirmar recepción**: el stock entra al destino. Si el artículo no existe allí (se busca por código o nombre), se crea con sus datos y fotos.
3. Si no llega o hay un error: **Cancelar / rechazar** → el stock vuelve al origen. Un traslado se resuelve una sola vez (aunque se toque dos veces).
- No se puede eliminar un artículo con un traslado en tránsito, ni un depósito con traslados registrados (se desactiva).

## Celular
Pensado para usar en el depósito: ventanas que suben desde abajo, botones grandes (Entrada / Salida / Ajuste / Trasladar), teclado numérico, fotos con la cámara del teléfono y pestañas con desplazamiento. Se probó en formato teléfono sin desborde horizontal.
- **Escanear QR**: abre la cámara trasera, lee la etiqueta y muestra el artículo listo para operar. También acepta escribir el código. La cámara requiere **https**.
- **Etiquetas QR** (`/admin/depositos/etiquetas`): se imprimen por depósito y se pegan en estantes o cajas. El QR es un enlace al artículo en el sistema (hay que tener la sesión iniciada; no contiene datos del stock).

## Fotos
Desde el teléfono se puede sacar la foto en el momento o elegirla de la galería. El navegador la **reduce (lado mayor 1600 px, JPEG)** antes de subirla. Formatos JPG/PNG/WEBP (verificados por contenido), máx. 4 MB. Con `BLOB_READ_WRITE_TOKEN` van a Vercel Blob (`inventario/`); sin él se guardan en la base (máx. 1,5 MB por foto).

## Permisos
Usa `canManageInventory` (admin, planner y técnico por defecto, igual que la lista de precios). Rutas `/admin/depositos` y `/api/depositos` restringidas por middleware.

## Base de datos
Migraciones `23_depositos` (`Deposito`, `ItemInventario`) y `24_movimientos` (`MovimientoInventario`, `Traslado`). Solo crean tablas. Dependencias nuevas: `qrcode` (generar etiquetas) y `jsqr` (leer el QR en el teléfono).

## Fuera de alcance (posibles siguientes pasos)
Vínculo con la lista de precios de materiales, importación masiva, exportar el historial, recepción parcial de un traslado y avisos en la campana de traslados pendientes.
