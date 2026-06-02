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
      <h2 className="mb-2 text-center font-heading text-2xl font-bold text-gray-900">Crear cuenta</h2>
      <p className="mb-6 text-center text-sm text-muted">Únete a la comunidad UV3</p>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-destructive">{error}</div>}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-gray-700">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-uv3-green"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
            Nombre de usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-uv3-green"
            placeholder="juanperez"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-uv3-green"
            placeholder="tu@correo.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-uv3-green"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-uv3-green py-2.5 font-semibold text-white transition-colors hover:bg-uv3-green-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-uv3-green transition-colors hover:text-uv3-green-dark">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
