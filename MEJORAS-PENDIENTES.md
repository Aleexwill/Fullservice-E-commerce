# Mejoras Pendientes — Full Service & Clean

> Generado por análisis completo del proyecto · Septiembre 2026
> Revisión de código: 11/09/2026. No implica pruebas funcionales con BD.
> Estado: [ ] pendiente | [x] resuelto | [~] en progreso

---

## 🔴 SEGURIDAD — Resolver antes de producción

- [~] **S1** — La mayoría de handlers administrativos ya usa `requireRole`. Completar validación dentro de los handlers que aún dependen del middleware, por ejemplo upload y notifications. Los POST públicos de formularios deben conservar su acceso público con validación de entrada.
- [~] **S2** — Ya hay control de roles en clientes, leads, presupuestos y CMS. Revisar cobertura restante, por ejemplo upload y notifications, que aún dependen de una sesión en middleware sin comprobar permisos de negocio en el handler.
- [ ] **S3** — Sin rate limiting en `/api/auth/login` — vulnerable a fuerza bruta.
- [ ] **S4** — Sin refresh de sesión — la sesión vence a las 12h sin renovación automática.

---

## 🟠 ROTO / INCOMPLETO — Fix urgente

- [~] **R1** — `since` se usa para contar no leídos, pero sobre una muestra de hasta 8 registros por tipo. Pendiente contar todos los registros posteriores a la fecha y validar el parámetro.
- [x] **R2** — El reporte usa `byPayment?.pending || 0`; `orders-store.ts` construye `byPayment` por estado de pago.
- [x] **R3** — La ficha del cliente permite editar campos mediante PUT y muestra historial de presupuestos y pedidos.
- [x] **R4** — El JSX de pedidos renderiza `CreateOrderModal` cuando `showCreateModal` está activo.
- [x] **R5** — El cálculo del presupuesto genera HTML imprimible con opciones para imprimir o guardar PDF desde el navegador.
- [ ] **R6** — Toggles de notificación en Config inoperables: se guardan en BD pero ningún endpoint los lee al crear registros.

---

## 🟡 FLUJOS FALTANTES — Alta prioridad

- [ ] **F1** — Sin email de confirmación al cliente tras checkout.
- [ ] **F2** — Sin recuperación de contraseña para usuarios de BD.
- [ ] **F3** — Sin "Convertir lead en presupuesto" — requiere re-tipear datos manualmente.
- [x] **F4** — PDF disponible mediante impresión del navegador desde el cálculo del presupuesto; no es un servicio de generación o envío automático.
- [ ] **F5** — Sin historial de cambios de estado en pedidos, presupuestos y leads.
- [ ] **F6** — Sin reenvío de invitación desde la UI de usuarios.

---

## 🟡 PÁGINAS PÚBLICAS FALTANTES

- [ ] **P1** — `/servicios/[slug]` — página de detalle por servicio.
- [ ] **P2** — `/portfolio/[slug]` — página de detalle por proyecto.
- [ ] **P3** — Tracking de orden para el cliente post-checkout.
- [~] **P4** — La tienda ya filtra categorías en cliente; verificar filtros de marca y filtrado paginado del lado servidor.
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

## Calidad técnica — revisión 11/09/2026

- [x] Compilación separada de migraciones; despliegue detenido ante errores de Prisma.
- [x] ESLint configurado con `next/core-web-vitals`, sin asistente interactivo.
- [x] README actualizado a la implementación actual.
- [ ] Resolver 14 advertencias existentes de ESLint: 11 sobre imágenes y 3 sobre hooks.
- [ ] Completar pruebas de login, CRUD y checkout con base de desarrollo configurada.
