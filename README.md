# Full Service & Clean — Servicios y e-commerce

Aplicación para servicios generales, tienda y gestión administrativa.

## Implementación actual

- Next.js 14 (App Router), React 18, TypeScript y Tailwind CSS.
- PostgreSQL (Neon) con Prisma y migraciones versionadas.
- CMS propio en el panel administrativo; no utiliza Sanity.
- Sesiones firmadas con HMAC, cookie HTTP-only y contraseñas con bcrypt.
- Roles: administrador, vendedor y técnico. No utiliza NextAuth.
- Carrito con Zustand; pedidos gestionados por las APIs del proyecto.
- La pasarela de pagos online está pendiente; Stripe no está integrado.
- Imágenes con Vercel Blob e invitaciones por email con Resend.

## Desarrollo local

Requisitos: Node.js 20 y una base PostgreSQL de desarrollo.

```bash
git clone https://github.com/Aleexwill/Fullservice-E-commerce.git
cd Fullservice-E-commerce
npm ci
cp .env.example .env
# Completar las variables de .env antes de continuar.
npm run db:deploy
npm run db:seed # Opcional: crea un producto de ejemplo.
npm run dev
```

Se usa `.env` para que tanto Prisma CLI como Next.js lean la configuración.
`DATABASE_URL` es la conexión agrupada de Neon y `DIRECT_URL` la directa para
migraciones. Configurar también `SESSION_SECRET` y las credenciales del administrador.
Vercel Blob, Resend y las integraciones de IA requieren sus variables cuando se usan.
Nunca subir credenciales al repositorio.

## Comprobaciones y despliegue

| Comando | Función |
| --- | --- |
| `npm run lint` | Ejecuta ESLint sin asistente interactivo |
| `npm run build` | Genera Prisma Client y compila Next.js; no ejecuta migraciones |
| `npm run db:deploy` | Aplica las migraciones versionadas a la base configurada |
| `npm run vercel-build` | Aplica migraciones y compila; se detiene si falla cualquiera |
| `npm run start` | Inicia la aplicación compilada |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:push` | Sincroniza el esquema sin generar migraciones; solo para prototipos |
| `npm run db:seed` | Crea el producto de prueba |
| `npm run db:studio` | Abre Prisma Studio |

`vercel.json` fija el comando de despliegue en `npm run vercel-build`.
Configurar las variables de cada entorno en Vercel. Una compilación local no valida
la conexión ni los circuitos de negocio: las pruebas de login, CRUD y checkout
requieren una base de prueba configurada. No usar datos de producción para esas pruebas.

## Estructura

- `src/app`: páginas públicas, panel `/admin` y endpoints `/api`.
- `src/components`: componentes visuales, formularios y módulos administrativos.
- `src/lib`: acceso a datos, autenticación, roles y utilidades.
- `src/styles/globals.css`: estilos compartidos.
- `prisma`: esquema, migraciones y datos de ejemplo.
- `public`: recursos estáticos.
- `docs`: documentos de diseño y planificación históricos; pueden describir funciones aún no implementadas.

Consultar `MEJORAS-PENDIENTES.md` para el seguimiento general y `MEJORAS-ADMIN.md`
para los detalles del panel. Los estados revisados se basan en código; no equivalen
a una validación funcional contra la base de datos.
