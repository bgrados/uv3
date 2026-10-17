'use client';

import { useState } from 'react';

import { SubmitButton } from '@/components/SubmitButton';
import { updateUserRoleAction } from '@/app/actions/users';
import { ASSIGNABLE_ROLES, ROLE_OPTION_LABEL } from '@/app/actions/schemas';
import type { User } from '@/types';

export function UsersTable({ users }: { users: User[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead className="bg-stone-50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-stone-700">Usuario</th>
            <th className="px-4 py-2 text-left font-semibold text-stone-700">Email</th>
            <th className="px-4 py-2 text-left font-semibold text-stone-700">Rol</th>
            <th className="px-4 py-2 text-left font-semibold text-stone-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-2 font-medium text-stone-800">
                {u.full_name || u.username || '(sin nombre)'}
              </td>
              <td className="px-4 py-2 text-stone-600">{u.email}</td>
              <td className="px-4 py-2 text-stone-600">
                {ROLE_OPTION_LABEL[u.role] ?? u.role}
              </td>
              <td className="px-4 py-2">
                <RoleForm user={u} />
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-stone-500">
                No hay usuarios que coincidan con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RoleForm({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setError(null);
    const role = String(formData.get('role') ?? '');
    const res = await updateUserRoleAction(user.id, role);
    if (res.success) {
      setMessage('Rol actualizado');
    } else {
      setError(res.error ?? 'Error al actualizar');
    }
    setLoading(false);
  }

  return (
    <form action={onSubmit} className="flex items-center gap-2">
      <select
        name="role"
        defaultValue={user.role}
        className="rounded-lg border px-2 py-1 text-sm"
        disabled={loading}
      >
        {ASSIGNABLE_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_OPTION_LABEL[r]}
          </option>
        ))}
      </select>
      <SubmitButton label="Guardar" pendingLabel="Guardando…" />
      {message && <span className="text-xs text-green-700">{message}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
