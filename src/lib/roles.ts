export type Role = 'admin' | 'vendedor' | 'tecnico';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  tecnico: 'Técnico',
};

// Qué puede ver/usar cada rol en el admin
export const ROLE_PERMISSIONS: Record<Role, {
  canManageUsers: boolean;
  canManageConfig: boolean;
  canManageContent: boolean;   // cms, carousel, promos, portfolio, servicios
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManagePresupuestos: boolean;
  canManageLeads: boolean;
  canManageClients: boolean;
  canManageInventory: boolean;
  canViewReports: boolean;
  canViewAnalytics: boolean;
}> = {
  admin: {
    canManageUsers: true, canManageConfig: true, canManageContent: true,
    canManageProducts: true, canManageOrders: true, canManagePresupuestos: true,
    canManageLeads: true, canManageClients: true, canManageInventory: true,
    canViewReports: true, canViewAnalytics: true,
  },
  vendedor: {
    canManageUsers: false, canManageConfig: false, canManageContent: false,
    canManageProducts: false, canManageOrders: true, canManagePresupuestos: true,
    canManageLeads: true, canManageClients: true, canManageInventory: false,
    canViewReports: true, canViewAnalytics: false,
  },
  tecnico: {
    canManageUsers: false, canManageConfig: false, canManageContent: false,
    canManageProducts: false, canManageOrders: false, canManagePresupuestos: true,
    canManageLeads: false, canManageClients: false, canManageInventory: true,
    canViewReports: false, canViewAnalytics: false,
  },
};

export function can(role: Role, permission: keyof typeof ROLE_PERMISSIONS['admin']): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

// Rutas admin restringidas por rol (prefijo)
export const RESTRICTED_ROUTES: { path: string; requiredPermission: keyof typeof ROLE_PERMISSIONS['admin'] }[] = [
  { path: '/admin/usuarios', requiredPermission: 'canManageUsers' },
  { path: '/admin/config', requiredPermission: 'canManageConfig' },
  { path: '/admin/contenido', requiredPermission: 'canManageContent' },
  { path: '/admin/carousel', requiredPermission: 'canManageContent' },
  { path: '/admin/promos', requiredPermission: 'canManageContent' },
  { path: '/admin/portfolio', requiredPermission: 'canManageContent' },
  { path: '/admin/servicios', requiredPermission: 'canManageContent' },
  { path: '/admin/productos', requiredPermission: 'canManageProducts' },
  { path: '/admin/reportes', requiredPermission: 'canViewReports' },
  { path: '/admin/analytics', requiredPermission: 'canViewAnalytics' },
  { path: '/admin/inventario', requiredPermission: 'canManageInventory' },
  { path: '/admin/leads', requiredPermission: 'canManageLeads' },
  { path: '/admin/clientes', requiredPermission: 'canManageClients' },
];
