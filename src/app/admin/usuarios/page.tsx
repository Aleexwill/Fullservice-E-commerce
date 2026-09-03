'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, MoreVertical, Trash2, ToggleLeft, ToggleRight, Mail } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/lib/roles';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-blue-muted text-blue-bright',
  vendedor: 'bg-green-900/40 text-green-400',
  tecnico: 'bg-amber-900/40 text-amber-400',
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('vendedor');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteError, setInviteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviteMsg('');
    setInviting(true);
    try {
      const res = await fetch('/api/invitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || 'Error al enviar invitación');
      } else {
        setInviteMsg(`Invitación enviada a ${inviteEmail}`);
        setInviteEmail('');
        setInviteName('');
        setInviteRole('vendedor');
        setShowInvite(false);
        load();
      }
    } catch {
      setInviteError('Error de conexión');
    } finally {
      setInviting(false);
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h2 uppercase text-arctic">Usuarios</h1>
          <p className="font-body text-body-sm text-steel-500">Gestioná los usuarios del panel de administración</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invitar usuario
        </button>
      </div>

      {inviteMsg && (
        <div className="mb-4 rounded-md bg-green-900/30 px-4 py-3 font-body text-body-sm text-green-400 flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0" />
          {inviteMsg}
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/70 backdrop-blur-sm px-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="mb-4 font-display text-h4 text-arctic">Invitar usuario</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="mb-1 block font-body text-caption text-steel-400">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-caption text-steel-400">Nombre (opcional)</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Nombre del usuario"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-caption text-steel-400">Rol</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as Role)}
                  className="input w-full"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="tecnico">Técnico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {inviteError && (
                <p className="rounded-md bg-danger-light/10 px-3 py-2 font-body text-caption text-danger-light">
                  {inviteError}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={inviting} className="btn-primary flex-1 justify-center disabled:opacity-50">
                  {inviting ? 'Enviando...' : 'Enviar invitación'}
                </button>
                <button type="button" onClick={() => setShowInvite(false)} className="btn-ghost flex-1 justify-center">
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
          <p className="py-16 text-center font-body text-body-sm text-steel-500">
            No hay usuarios aún. Invitá al primero.
          </p>
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
                    <p className="font-body text-body-sm font-medium text-arctic">{user.name}</p>
                    <p className="font-body text-caption text-steel-500">{user.email}</p>
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
                        onClick={() => toggleActive(user)}
                        aria-label={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                        className="rounded p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic"
                      >
                        {user.isActive ? <ToggleRight className="h-4 w-4 text-green-400" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        aria-label="Eliminar usuario"
                        className="rounded p-1.5 text-steel-500 hover:bg-danger-light/10 hover:text-danger-light"
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
    </div>
  );
}
