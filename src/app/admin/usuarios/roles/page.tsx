'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, Shield, Lock, Edit2, Check, X } from 'lucide-react';

interface Permissions {
  canManageUsers: boolean;
  canManageConfig: boolean;
  canManageContent: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManagePresupuestos: boolean;
  canManageLeads: boolean;
  canManageClients: boolean;
  canManageInventory: boolean;
  canViewReports: boolean;
  canViewAnalytics: boolean;
}

interface CustomRole {
  id: string;
  name: string;
  label: string;
  permissions: Partial<Permissions>;
  isSystem: boolean;
}

const PERMISSION_GROUPS: { group: string; items: { key: keyof Permissions; label: string; description: string }[] }[] = [
  {
    group: 'Administración',
    items: [
      { key: 'canManageUsers',  label: 'Usuarios',       description: 'Invitar, activar/desactivar y eliminar usuarios' },
      { key: 'canManageConfig', label: 'Configuración',  description: 'Ajustes generales del sitio' },
    ],
  },
  {
    group: 'Contenido',
    items: [
      { key: 'canManageContent',  label: 'Contenido del sitio', description: 'CMS, carousel, promos, portfolio, servicios' },
      { key: 'canManageProducts', label: 'Productos',            description: 'Crear, editar y eliminar productos' },
    ],
  },
  {
    group: 'Comercial',
    items: [
      { key: 'canManageOrders',        label: 'Pedidos',       description: 'Ver y gestionar pedidos de la tienda' },
      { key: 'canManagePresupuestos',  label: 'Presupuestos',  description: 'Crear y gestionar presupuestos de servicios' },
      { key: 'canManageLeads',         label: 'Leads',         description: 'Ver y gestionar leads entrantes' },
      { key: 'canManageClients',       label: 'Clientes',      description: 'Gestionar la ficha de clientes' },
    ],
  },
  {
    group: 'Operaciones',
    items: [
      { key: 'canManageInventory', label: 'Inventario',  description: 'Gestionar stock y materiales' },
      { key: 'canViewReports',     label: 'Reportes',    description: 'Ver reportes de ventas y servicios' },
      { key: 'canViewAnalytics',   label: 'Analytics',   description: 'Ver estadísticas de visitas' },
    ],
  },
];

const EMPTY_PERMS: Permissions = {
  canManageUsers: false, canManageConfig: false, canManageContent: false,
  canManageProducts: false, canManageOrders: false, canManagePresupuestos: false,
  canManageLeads: false, canManageClients: false, canManageInventory: false,
  canViewReports: false, canViewAnalytics: false,
};

export default function RolesPage() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomRole | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editPerms, setEditPerms] = useState<Permissions>({ ...EMPTY_PERMS });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/roles');
    const data = res.ok ? await res.json() : { roles: [] };
    setRoles(data.roles ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function selectRole(role: CustomRole) {
    setSelected(role);
    setEditLabel(role.label);
    setEditPerms({ ...EMPTY_PERMS, ...role.permissions });
    setMsg('');
  }

  async function saveRole() {
    if (!selected) return;
    setSaving(true);
    setMsg('');
    const res = await fetch(`/api/roles/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: editLabel, permissions: editPerms }),
    });
    if (res.ok) {
      setMsg('Guardado');
      await load();
      // Re-select with updated data
      const updated = await res.json();
      setSelected(updated.role);
    } else {
      const d = await res.json();
      setMsg(d.error || 'Error al guardar');
    }
    setSaving(false);
  }

  async function deleteRole(role: CustomRole) {
    if (!confirm(`¿Eliminar el rol "${role.label}"? Los usuarios con este rol pasarán a "Vendedor".`)) return;
    const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' });
    if (res.ok) {
      if (selected?.id === role.id) setSelected(null);
      await load();
    }
  }

  async function createRole() {
    setCreateError('');
    setCreating(true);
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, label: newLabel, permissions: EMPTY_PERMS }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCreateError(data.error || 'Error al crear');
    } else {
      setNewName('');
      setNewLabel('');
      setShowNew(false);
      await load();
      selectRole(data.role);
    }
    setCreating(false);
  }

  function togglePerm(key: keyof Permissions) {
    setEditPerms((p) => ({ ...p, [key]: !p[key] }));
    setMsg('');
  }

  const isDirty = selected && (
    editLabel !== selected.label ||
    JSON.stringify(editPerms) !== JSON.stringify({ ...EMPTY_PERMS, ...selected.permissions })
  );

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/usuarios" className="flex h-8 w-8 items-center justify-center rounded-md text-steel-400 hover:bg-steel-900 hover:text-arctic">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h2 uppercase text-arctic">Roles y permisos</h1>
          <p className="font-body text-body-sm text-steel-500">Definí qué puede hacer cada rol en el panel</p>
        </div>
        <button onClick={() => { setShowNew(true); setCreateError(''); }} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo rol
        </button>
      </div>

      {/* New role modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/70 px-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6">
            <h2 className="mb-4 font-display text-h4 text-arctic">Nuevo rol</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-body text-caption text-steel-400">Nombre interno (sin espacios)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="ej: supervisor"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-caption text-steel-400">Etiqueta visible</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="ej: Supervisor"
                  className="input w-full"
                />
              </div>
              {createError && <p className="rounded bg-danger-light/10 px-3 py-2 font-body text-caption text-danger-light">{createError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={createRole} disabled={creating || !newName.trim() || !newLabel.trim()} className="btn-primary flex-1 justify-center disabled:opacity-50">
                  {creating ? 'Creando...' : 'Crear rol'}
                </button>
                <button onClick={() => setShowNew(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Roles list */}
        <div className="card overflow-hidden lg:col-span-1">
          <div className="border-b border-steel-900/40 px-4 py-3">
            <h2 className="font-display text-h4 uppercase text-steel-400">Roles</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><div className="h-5 w-5 animate-spin rounded-full border-2 border-steel-700 border-t-arctic" /></div>
          ) : (
            <ul className="divide-y divide-steel-900/30">
              {roles.map(role => (
                <li key={role.id}>
                  <button
                    onClick={() => selectRole(role)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-steel-900/30 ${selected?.id === role.id ? 'bg-steel-900/50' : ''}`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${role.isSystem ? 'bg-blue-muted text-blue-bright' : 'bg-yellow-muted text-yellow-bright'}`}>
                      {role.isSystem ? <Lock className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-body-sm font-medium text-arctic">{role.label}</p>
                      <p className="font-body text-caption text-steel-500">{role.name}</p>
                    </div>
                    {!role.isSystem && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteRole(role); }}
                        className="ml-1 rounded p-1 text-steel-700 hover:bg-danger-light/10 hover:text-danger-light"
                        title="Eliminar rol"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Permissions editor */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card flex h-full min-h-48 items-center justify-center">
              <p className="font-body text-body-sm text-steel-500">Seleccioná un rol para editar sus permisos</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {/* Editor header */}
              <div className="flex items-center justify-between border-b border-steel-900/40 px-5 py-4">
                <div className="flex items-center gap-3">
                  {selected.isSystem ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-muted">
                      <Lock className="h-4 w-4 text-blue-bright" />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-yellow-muted">
                      <Shield className="h-4 w-4 text-yellow-bright" />
                    </div>
                  )}
                  <div>
                    {selected.isSystem ? (
                      <p className="font-display text-h4 text-arctic">{selected.label}</p>
                    ) : (
                      <input
                        type="text"
                        value={editLabel}
                        onChange={e => { setEditLabel(e.target.value); setMsg(''); }}
                        className="input py-1 text-arctic font-display"
                      />
                    )}
                    <p className="font-body text-caption text-steel-500">{selected.name}{selected.isSystem && ' · Rol del sistema'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {msg && (
                    <span className={`font-body text-caption ${msg === 'Guardado' ? 'text-success-bright' : 'text-danger-light'}`}>
                      {msg}
                    </span>
                  )}
                  {isDirty && (
                    <button onClick={saveRole} disabled={saving} className="btn-primary gap-2 disabled:opacity-50">
                      <Save className="h-3.5 w-3.5" />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  )}
                </div>
              </div>

              {/* Permission groups */}
              <div className="divide-y divide-steel-900/30 p-5">
                {PERMISSION_GROUPS.map(({ group, items }) => (
                  <div key={group} className="py-4 first:pt-0 last:pb-0">
                    <h3 className="mb-3 font-body text-caption font-semibold uppercase tracking-wider text-steel-500">{group}</h3>
                    <div className="space-y-2">
                      {items.map(({ key, label, description }) => {
                        const checked = editPerms[key] ?? false;
                        return (
                          <label
                            key={key}
                            className={`flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 transition-colors ${selected.isSystem ? 'cursor-not-allowed opacity-60' : 'hover:bg-steel-900/30'}`}
                          >
                            <button
                              type="button"
                              disabled={selected.isSystem}
                              onClick={() => !selected.isSystem && togglePerm(key)}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                                checked
                                  ? 'border-blue-bright bg-blue-bright text-white'
                                  : 'border-steel-700 bg-steel-900/40 text-transparent'
                              } ${selected.isSystem ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              aria-label={label}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className="font-body text-body-sm font-medium text-arctic">{label}</p>
                              <p className="font-body text-caption text-steel-500">{description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {selected.isSystem && (
                  <p className="mt-2 flex items-center gap-2 rounded-md bg-blue-muted/30 px-3 py-2 font-body text-caption text-steel-400">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-blue-bright" />
                    Los roles del sistema no se pueden modificar
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
