'use client';

import { useState } from 'react';
import { resetPasswordAction } from '@/app/auth/actions';

export default function ResetPasswordPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    const result = await resetPasswordAction(formData);
    if (!result.success && result.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <>
      <h2 className="font-heading text-2xl font-bold text-center text-gray-900 mb-2">
        Nueva Contraseña
      </h2>
      <p className="text-center text-muted text-sm mb-6">
        Ingresa tu nueva contraseña
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uv3-green focus:border-transparent outline-none transition-all"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar contraseña
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uv3-green focus:border-transparent outline-none transition-all"
            placeholder="Repite tu contraseña"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-uv3-green text-white font-semibold rounded-lg hover:bg-uv3-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Cambiar Contraseña'}
        </button>
      </form>
    </>
  );
}
