'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UserPlus, Trash2, ToggleLeft, ToggleRight, Shield, X, Eye, EyeOff, AlertTriangle, KeyRound, RefreshCw } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/lib/roles';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-blue-muted text-blue-bright',
  vendedor: 'bg-green-900/40 text-green-400',
  tecnico: 'bg-amber-900/40 text-amber-400',
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<{ name: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetPass, setResetPass] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState('');

  // form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('vendedor');
  const [tempPass, setTempPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formMsg, setFormMsg] = useState('');

  function generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/roles'),
      ]);
      const usersData = await usersRes.json();
      const rolesData = rolesRes.ok ? await rolesRes.json() : { roles: [] };
      setUsers(usersData.users ?? []);
      setAvailableRoles((rolesData.roles ?? []).map((r: { name: string; label: string }) => ({ name: r.name, label: r.label })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEmail(''); setName(''); setRole('vendedor'); setTempPass('');
    setFormError(''); setFormMsg(''); setShowPass(false);
    setShowCreate(true);
  }

  function openReset(user: User) {
    setResetUser(user);
    setResetPass('');
    setResetError('');
    setShowResetPass(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUser) return;
    setResetError('');
    setResetSaving(true);
    try {
      const res = await fetch(`/api/usuarios/${resetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Error al restablecer');
      } else {
        setFormMsg(`Contraseña de ${resetUser.name} restablecida. Deberá cambiarla al ingresar.`);
        setResetUser(null);
        load();
      }
    } catch {
      setResetError('Error de conexión');
    } finally {
      setResetSaving(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, password: tempPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Error al crear el usuario');
      } else {
        setFormMsg(`Usuario ${name || email} creado. Al ingresar por primera vez deberá cambiar la contraseña.`);
        setShowCreate(false);
        load();
      }
    } catch {
      setFormError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: User) {
    await fetch(`/api/usuarios/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    load();
  }

  async function deleteUser(user: User) {
    if (!confirm(`¿Eliminar al usuario ${user.name}? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/usuarios/${user.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h2 uppercase text-arctic">Usuarios</h1>
          <p className="font-body text-body-sm text-steel-500">Gestioná los accesos al panel de administración</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/usuarios/roles" className="btn-secondary flex items-center gap-2">
            <Shield className="h-4 w-4" /> Roles
          </Link>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Nuevo usuario
          </button>
        </div>
      </div>

      {/* Success toast */}
      {formMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-green-900/30 px-4 py-3 font-body text-body-sm text-green-400">
          <span className="mt-0.5 shrink-0">✓</span>
          <span>{formMsg}</span>
          <button onClick={() => setFormMsg('')} className="ml-auto shrink-0 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/70 px-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-h4 text-arctic">Nuevo usuario</h2>
              <button onClick={() => setShowCreate(false)} className="rounded p-1 text-steel-500 hover:text-arctic"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block font-body text-caption text-steel-400">Nombre completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Juan García"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-caption text-steel-400">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-caption text-steel-400">Rol</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="input w-full">
                  {availableRoles.length > 0
                    ? availableRoles.map(r => <option key={r.name} value={r.name}>{r.label}</option>)
                    : (
                      <>
                        <option value="vendedor">Vendedor</option>
                        <option value="tecnico">Técnico</option>
                        <option value="admin">Administrador</option>
                      </>
                    )
                  }
                </select>
              </div>
              <div>
                <label className="mb-1 block font-body text-caption text-steel-400">Contraseña temporal</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={tempPass}
                    onChange={e => setTempPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="input w-full pr-20"
                    required
                    minLength={6}
                  />
                  <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => { const p = generatePassword(); setTempPass(p); setShowPass(true); }}
                      title="Generar contraseña"
                      className="rounded p-1.5 text-steel-500 hover:text-arctic"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="rounded p-1.5 text-steel-500 hover:text-arctic"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="mt-1 font-body text-caption text-steel-500">
                  El usuario deberá cambiarla al ingresar por primera vez.
                </p>
              </div>

              {formError && (
                <p className="rounded-md bg-danger-light/10 px-3 py-2 font-body text-caption text-danger-bright">{formError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
                  {saving ? 'Creando...' : 'Crear usuario'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1 justify-center">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/70 px-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-h4 text-arctic">Restablecer contraseña</h2>
              <button onClick={() => setResetUser(null)} className="rounded p-1 text-steel-500 hover:text-arctic"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 font-body text-body-sm text-steel-400">
              Usuario: <span className="text-arctic">{resetUser.name}</span> ({resetUser.email})
            </p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="mb-1 block font-body text-caption text-steel-400">Nueva contraseña temporal</label>
                <div className="relative">
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    value={resetPass}
                    onChange={e => setResetPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="input w-full pr-20"
                    required
                    minLength={6}
                  />
                  <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => { const p = generatePassword(); setResetPass(p); setShowResetPass(true); }}
                      title="Generar contraseña"
                      className="rounded p-1.5 text-steel-500 hover:text-arctic"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetPass(v => !v)}
                      className="rounded p-1.5 text-steel-500 hover:text-arctic"
                    >
                      {showResetPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="mt-1 font-body text-caption text-steel-500">
                  El usuario deberá cambiarla al próximo ingreso.
                </p>
              </div>
              {resetError && (
                <p className="rounded-md bg-danger-light/10 px-3 py-2 font-body text-caption text-danger-bright">{resetError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={resetSaving} className="btn-primary flex-1 justify-center disabled:opacity-50">
                  {resetSaving ? 'Guardando...' : 'Restablecer'}
                </button>
                <button type="button" onClick={() => setResetUser(null)} className="btn-ghost flex-1 justify-center">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-steel-700 border-t-arctic" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-16 text-center font-body text-body-sm text-steel-500">No hay usuarios aún.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-steel-900/40">
                <th className="px-4 py-3 text-left font-body text-caption font-semibold uppercase tracking-wider text-steel-500">Usuario</th>
                <th className="px-4 py-3 text-left font-body text-caption font-semibold uppercase tracking-wider text-steel-500">Rol</th>
                <th className="px-4 py-3 text-left font-body text-caption font-semibold uppercase tracking-wider text-steel-500">Estado</th>
                <th className="px-4 py-3 text-right font-body text-caption font-semibold uppercase tracking-wider text-steel-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-900/30">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-steel-900/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-body text-body-sm font-medium text-arctic">{user.name}</p>
                        <p className="font-body text-caption text-steel-500">{user.email}</p>
                      </div>
                      {user.mustChangePassword && (
                        <span title="Debe cambiar contraseña al ingresar">
                          <AlertTriangle className="h-3.5 w-3.5 text-yellow-bright" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 font-body text-[0.65rem] font-semibold ${ROLE_BADGE[user.role] ?? 'bg-steel-900 text-steel-300'}`}>
                      {ROLE_LABELS[user.role as Role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 font-body text-[0.65rem] font-semibold ${user.isActive ? 'bg-green-900/30 text-green-400' : 'bg-steel-900 text-steel-500'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openReset(user)}
                        aria-label="Restablecer contraseña"
                        title="Restablecer contraseña"
                        className="rounded p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        aria-label={user.isActive ? 'Desactivar' : 'Activar'}
                        className="rounded p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic"
                      >
                        {user.isActive ? <ToggleRight className="h-4 w-4 text-green-400" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        aria-label="Eliminar usuario"
                        className="rounded p-1.5 text-steel-500 hover:bg-danger-light/10 hover:text-danger-bright"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Permissions legend */}
      <div className="mt-4 flex items-center gap-2 text-caption text-steel-500">
        <AlertTriangle className="h-3.5 w-3.5 text-yellow-bright" />
        <span>Ícono amarillo = el usuario debe cambiar su contraseña al próximo ingreso.</span>
      </div>
    </div>
  );
}
