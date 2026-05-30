'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signupAction } from '@/app/auth/actions';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    const result = await signupAction(formData);
    if (!result.success && result.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <>
      <h2 className="font-heading text-2xl font-bold text-center text-gray-900 mb-2">
        Crear Cuenta
      </h2>
      <p className="text-center text-muted text-sm mb-6">
        Únete a la comunidad UV3
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uv3-green focus:border-transparent outline-none transition-all"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uv3-green focus:border-transparent outline-none transition-all"
            placeholder="juanperez"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uv3-green focus:border-transparent outline-none transition-all"
            placeholder="tu@correo.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-uv3-green text-white font-semibold rounded-lg hover:bg-uv3-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registrando...' : 'Crear Cuenta'}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-uv3-green font-medium hover:text-uv3-green-dark">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
