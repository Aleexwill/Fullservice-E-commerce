# Mejoras Pendientes — Full Service & Clean

> Generado por análisis completo del proyecto · Septiembre 2026
> Estado: [ ] pendiente | [x] resuelto | [~] en progreso

---

## 🔴 SEGURIDAD — Resolver antes de producción

- [ ] **S1** — API mutating routes sin auth en handler: `POST/PUT/DELETE` en clientes, leads, presupuestos, portfolio, servicios, carousel, config, contenido no llaman `verifySessionToken` internamente. Solo dependen del middleware.
- [ ] **S2** — Sin control de rol en APIs: un `tecnico` bloqueado en `/admin/leads` puede llamar `PUT /api/leads/[id]` directamente. El `can()` no se aplica en handlers de API (solo en `/api/usuarios`).
- [ ] **S3** — Sin rate limiting en `/api/auth/login` — vulnerable a fuerza bruta.
- [ ] **S4** — Sin refresh de sesión — la sesión vence a las 12h sin renovación automática.

---

## 🟠 ROTO / INCOMPLETO — Fix urgente

- [ ] **R1** — Campana de notificaciones siempre desactualizada: el parámetro `since` en `/api/notifications/route.ts` se calcula pero nunca se pasa al query de Prisma. El contador de no leídos siempre es incorrecto.
- [ ] **R2** — Reporte e-commerce: `reportes/ecommerce/page.tsx` lee `byPayment.pending` que no existe en la respuesta de `/api/pedidos/stats`. Muestra `undefined`.
- [ ] **R3** — Panel de clientes de solo lectura: `PUT /api/clientes/[id]` está implementado pero la UI nunca lo llama. No se puede editar ningún dato del cliente.
- [ ] **R4** — "Crear pedido manual" no renderiza: `showCreateModal` existe como estado pero el bloque `{showCreateModal && <CreateOrderModal />}` nunca aparece en el JSX.
- [ ] **R5** — Botón imprimir presupuesto es stub: ícono `Printer` importado pero `onClick` sin implementación. No genera PDF.
- [ ] **R6** — Toggles de notificación en Config inoperables: se guardan en BD pero ningún endpoint los lee al crear registros.

---

## 🟡 FLUJOS FALTANTES — Alta prioridad

- [ ] **F1** — Sin email de confirmación al cliente tras checkout.
- [ ] **F2** — Sin recuperación de contraseña para usuarios de BD.
- [ ] **F3** — Sin "Convertir lead en presupuesto" — requiere re-tipear datos manualmente.
- [ ] **F4** — Sin PDF de presupuesto para enviar al cliente.
- [ ] **F5** — Sin historial de cambios de estado en pedidos, presupuestos y leads.
- [ ] **F6** — Sin reenvío de invitación desde la UI de usuarios.

---

## 🟡 PÁGINAS PÚBLICAS FALTANTES

- [ ] **P1** — `/servicios/[slug]` — página de detalle por servicio.
- [ ] **P2** — `/portfolio/[slug]` — página de detalle por proyecto.
- [ ] **P3** — Tracking de orden para el cliente post-checkout.
- [ ] **P4** — Filtros de categoría/marca en `/tienda` (la API los soporta, la UI no).
- [ ] **P5** — Paginación en `/tienda` pública (carga todos los productos de una vez).

---

## 🟢 DATOS Y ESQUEMA

- [ ] **D1** — `scheduledDate` guardado como `String` plano — debería ser `DateTime` con zona horaria.
- [ ] **D2** — Inconsistencia `category` en Cliente: schema dice `tienda` pero código usa `"ecommerce"`.
- [ ] **D3** — `Material` sin campo `quantity` — el inventario solo guarda precio, no stock real.
- [ ] **D4** — Sin historial de precios en materiales — cambio sobreescribe sin auditoría.
- [ ] **D5** — `Order.items` y `Order.customer` como JSON opaco sin FK a `Product`/`Cliente`.
- [ ] **D6** — Sin `lastLoginAt` en `User` — no se pueden auditar cuentas inactivas.
- [ ] **D7** — `promoStartsAt`/`promoEndsAt` sin job automático — las promos no expiran solas.

---

## 🟢 UX Y DETALLES

- [ ] **U1** — `window.confirm()` para acciones destructivas — fuera del estilo del panel.
- [ ] **U2** — Slug de producto sin generación automática desde el nombre.
- [ ] **U3** — Campo de ícono en servicios es texto libre sin selector visual.
- [ ] **U4** — Reordenamiento de carousel/promos/portfolio por número manual — falta drag & drop.
- [ ] **U5** — Sin editor de texto enriquecido en campos de contenido (about, misión, visión).
- [ ] **U6** — Sin exportación de reportes a CSV o PDF.
- [ ] **U7** — Sin filtro de fecha en analytics ni reportes (siempre muestra período fijo).
- [ ] **U8** — Google Analytics y Meta Pixel configurables en Config pero scripts nunca inyectados en el layout público.
- [ ] **U9** — `groq-sdk` instalado — verificar si está en uso o es dependencia muerta.
- [ ] **U10** — Sin paginación en listado de productos del admin (hay paginación pero inline, no componente reutilizable).

---

## ✅ RESUELTOS (referencia)

- [x] Sidebar responsive con hamburguesa en mobile (`src/app/admin/layout.tsx`)
- [x] Touch targets mínimos 44×44px en admin y navbar pública
- [x] Tamaños de texto sub-12px corregidos en múltiples páginas
- [x] Imágenes `<img>` → `<NextImage>` en tienda y carrito
- [x] Sistema de roles (admin / vendedor / técnico) con RBAC en middleware
- [x] Flujo de invitación por email con Resend
- [x] Login DB-first con fallback a env admin
- [x] Panel derecho del hero con stats + cards de servicios
- [x] Bug de clientes no aparecen tras crear (closure stale en `fetchData`)
- [x] Lazy-init de Resend para evitar crash en build de Vercel
